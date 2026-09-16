import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeesService }   from '../fees/fees.service';

@Injectable()
export class HaulageService {
  private readonly logger = new Logger(HaulageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fees:   FeesService,
  ) {}

  /* ────────────────────────────────────────────────────────
     PROFILE
  ──────────────────────────────────────────────────────── */
  async createOrUpdateProfile(userId: string, data: {
    companyName?:     string;
    bio?:             string;
    vehicleType:      string;
    vehicleCapacity:  number;
    licensePlate?:    string;
    yearsExperience?: number;
    coverageStates:   string[];
    coverageRoutes?:  string;
  }) {
    return this.prisma.haulageProfile.upsert({
      where:  { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getProfile(userId: string) {
    return this.prisma.haulageProfile.findUnique({ where: { userId } });
  }

  /* ────────────────────────────────────────────────────────
     JOBS — list open delivery jobs
     Haulage providers browse these and apply.
  ──────────────────────────────────────────────────────── */
  async listJobs(filters: {
    state?:  string;
    page?:   number;
    limit?:  number;
    userId?: string; /* for checking if already applied */
  }) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;
    const where: any = { status: 'OPEN' };
    if (filters.state) {
      where.OR = [
        { pickupState:   { contains: filters.state, mode: 'insensitive' } },
        { deliveryState: { contains: filters.state, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.haulageJob.findMany({
        where,
        include: {
          order: {
            include: {
              items:  { include: { product: { select: { name: true, priceUnit: true, quantityUnit: true } } } },
              seller: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
          },
          applications: filters.userId
            ? { where: { applicantId: filters.userId }, select: { id: true, status: true } }
            : false,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.haulageJob.count({ where }),
    ]);

    /* Shape the response */
    const data = jobs.map(job => {
      const items   = job.order?.items ?? [];
      const summary = items.map(i => i.product?.name).filter(Boolean).join(', ');
      const weight  = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);

      return {
        ...job,
        cargoSummary:     summary || 'Agricultural produce',
        totalWeight:      weight,
        sellerPhone:      job.order?.seller?.phone,
        sellerState:      job.pickupState,
        applicationCount: (job as any)._count?.applications ?? 0,
        haulageApplications: (job as any).applications ?? [],
        order:            undefined, /* strip full order from list */
        orderNumber:      job.order?.orderNumber,
      };
    });

    return { data, meta: { total, page, limit } };
  }

  /* ────────────────────────────────────────────────────────
     APPLY for a job
  ──────────────────────────────────────────────────────── */
  async applyForJob(jobId: string, applicantId: string, data: {
    proposedFee?: number;
    note?:        string;
  }) {
    const job = await this.prisma.haulageJob.findUnique({ where: { id: jobId } });
    if (!job)              throw new NotFoundException('Job not found');
    if (job.status !== 'OPEN') throw new BadRequestException('This job is no longer accepting applications');

    /* Get haulage profile */
    const profile = await this.prisma.haulageProfile.findUnique({
      where: { userId: applicantId },
    });
    if (!profile) throw new BadRequestException(
      'Please complete your haulage profile before applying for jobs',
    );

    /* Check not already applied */
    const existing = await this.prisma.haulageApplication.findUnique({
      where: { jobId_applicantId: { jobId, applicantId } },
    });
    if (existing) throw new BadRequestException('You have already applied for this job');

    const application = await this.prisma.haulageApplication.create({
      data: {
        jobId,
        applicantId,
        haulageProfileId: profile.id,
        proposedFee:      data.proposedFee,
        note:             data.note,
      },
      include: {
        applicant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        profile:   true,
      },
    });

    this.logger.log(`Haulage application: job=${jobId} applicant=${applicantId}`);
    return application;
  }

  /* ────────────────────────────────────────────────────────
     AWARD job to an applicant (seller/admin action)
  ──────────────────────────────────────────────────────── */
  async awardJob(jobId: string, applicationId: string, awardedById: string) {
    const job = await this.prisma.haulageJob.findUnique({
      where:   { id: jobId },
      include: { order: { select: { sellerId: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');

    /* Only the seller of the order (or admin) can award */
    if (job.order?.sellerId !== awardedById) {
      throw new ForbiddenException('Only the seller can award this job');
    }

    const application = await this.prisma.haulageApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application || application.jobId !== jobId) {
      throw new NotFoundException('Application not found');
    }

    /* Mark job awarded, reject other applications */
    await Promise.all([
      this.prisma.haulageJob.update({
        where: { id: jobId },
        data: {
          status:      'AWARDED',
          awardedToId: application.applicantId,
          agreedFee:   application.proposedFee ?? job.offeredFee,
        },
      }),
      this.prisma.haulageApplication.update({
        where: { id: applicationId },
        data:  { status: 'ACCEPTED', respondedAt: new Date() },
      }),
      /* Reject all other pending applications */
      this.prisma.haulageApplication.updateMany({
        where: { jobId, id: { not: applicationId }, status: 'PENDING' },
        data:  { status: 'REJECTED', respondedAt: new Date() },
      }),
    ]);

    this.logger.log(`Job awarded: job=${jobId} to=${application.applicantId}`);
    return this.prisma.haulageJob.findUnique({
      where:   { id: jobId },
      include: { awardedTo: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    });
  }

  /* ────────────────────────────────────────────────────────
     MARK JOB DELIVERED + charge commission
  ──────────────────────────────────────────────────────── */
  async completeJob(jobId: string, userId: string) {
    const job = await this.prisma.haulageJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.awardedToId !== userId) {
      throw new ForbiddenException('Only the assigned haulage provider can complete this job');
    }

    const agreedFee = job.agreedFee ?? job.offeredFee ?? 0;

    /* Charge haulage commission */
    const commission = await this.fees.chargeHaulageCommission(
      jobId, userId, agreedFee,
    );

    const updatedJob = await this.prisma.haulageJob.update({
      where: { id: jobId },
      data:  { status: 'DELIVERED', deliveredAt: new Date(), platformCut: commission.amount },
    });

    /* Also update the parent order */
    await this.prisma.order.update({
      where: { id: job.orderId },
      data:  { status: 'DELIVERED' },
    });

    this.logger.log(`Job completed: job=${jobId} commission=₦${commission.amount}`);
    return { job: updatedJob, commission };
  }

  /* ────────────────────────────────────────────────────────
     MY APPLICATIONS — haulage provider sees their history
  ──────────────────────────────────────────────────────── */
  async getMyApplications(applicantId: string) {
    return this.prisma.haulageApplication.findMany({
      where:   { applicantId },
      include: {
        job: {
          include: {
            order: { select: { orderNumber: true, sellerId: true } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  /* ────────────────────────────────────────────────────────
     MY ACTIVE JOBS — awarded + in-transit jobs
  ──────────────────────────────────────────────────────── */
  async getMyActiveJobs(userId: string) {
    return this.prisma.haulageJob.findMany({
      where:   { awardedToId: userId, status: { in: ['AWARDED', 'IN_TRANSIT'] } },
      include: {
        order: {
          include: {
            items:  { include: { product: { select: { name: true } } } },
            seller: { select: { id: true, firstName: true, lastName: true, phone: true } },
            buyer:  { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ────────────────────────────────────────────────────────
     SELLER: view applications for their jobs
  ──────────────────────────────────────────────────────── */
  async getJobApplications(jobId: string, sellerId: string) {
    const job = await this.prisma.haulageJob.findUnique({
      where:   { id: jobId },
      include: { order: { select: { sellerId: true } } },
    });
    if (!job)                           throw new NotFoundException('Job not found');
    if (job.order?.sellerId !== sellerId) throw new ForbiddenException('Access denied');

    return this.prisma.haulageApplication.findMany({
      where:   { jobId },
      include: {
        applicant: { select: { id: true, firstName: true, lastName: true, phone: true } },
        profile:   true,
      },
      orderBy: { appliedAt: 'asc' },
    });
  }

  /* ────────────────────────────────────────────────────────
     AUTO-CREATE JOB from a confirmed order (called by OrdersService)
  ──────────────────────────────────────────────────────── */
  async createJobFromOrder(orderId: string, orderData: {
    sellerId:       string;
    sellerState?:   string;
    sellerLga?:     string;
    deliveryState?: string;
    deliveryAddr?:  string;
    deliveryFee?:   number;
    cargoSummary?:  string;
    totalWeight?:   number;
  }) {
    /* Idempotent — don't create duplicate jobs */
    const existing = await this.prisma.haulageJob.findUnique({ where: { orderId } });
    if (existing) return existing;

    const job = await this.prisma.haulageJob.create({
      data: {
        orderId,
        status:          'OPEN',
        offeredFee:      orderData.deliveryFee ?? 0,
        pickupState:     orderData.sellerState,
        pickupAddress:   orderData.sellerLga,
        deliveryState:   orderData.deliveryState,
        deliveryAddress: orderData.deliveryAddr,
        cargoSummary:    orderData.cargoSummary,
        totalWeight:     orderData.totalWeight,
      },
    });

    this.logger.log(`HaulageJob created for order: ${orderId}`);
    return job;
  }
}
