# DG-LETS AGRI MARKET — Master Spec & Build Phases

> Source: Full product specification supplied by Founder/CEO, September 2026.
> This document is the single source of truth for all development teams.

---

## PHASE 1 — MVP (Build Now)

These are the minimum features to go live and serve real users.
Everything in Phase 1 must work end-to-end before Phase 2 begins.

### P1-AUTH
- [x] User registration (all 7 roles)
- [x] OTP phone verification
- [x] Login (password + OTP)
- [x] JWT + refresh token auth
- [x] Forgot / reset password
- [x] Registration fee charge on account activation (Paystack)
- [x] Post-registration profile setup screen for HAULAGE role

### P1-FARMER
- [x] Farmer profile creation
- [x] Create / edit / delete product listings
- [x] Upload product images
- [x] Set price, quantity, unit, state/LGA
- [x] View own orders (selling tab)
- [x] Accept / reject / update order status
- [x] Seller dashboard: overview of sales, revenue, pending orders
- [x] Basic seller verification badge (admin sets verified flag)

### P1-BUYER
- [x] Browse / search products
- [x] Filter by category, state, price
- [x] View product detail and seller profile
- [x] Add to cart and place order
- [x] Payment via Paystack
- [x] Order tracking (status timeline)
- [x] Confirm receipt
- [x] Save / wishlist products (UI exists, needs display screen)
- [x] Rate and review after order completes

### P1-MARKETPLACE
- [x] Product search with keyword + filters
- [x] Category browsing
- [x] Market prices ticker
- [x] Product save/unsave
- [x] Verified seller badge visible on product cards
- [x] "Near me" filter using device location

### P1-LOGISTICS
- [x] HAULAGE role registration
- [x] Haulage Jobs screen (UI built)
- [x] Apply for delivery job
- [x] HaulageProfile setup screen (coverage states, vehicle type, capacity)
- [x] Backend: HaulageModule (list jobs, apply, award, complete)
- [x] Haulage commission deducted at job completion
- [x] Haulage provider dashboard (active jobs, completed, earnings)

### P1-ORDERS
- [x] Full order lifecycle (PENDING → COMPLETED)
- [x] Order detail with timeline
- [x] Buyer + seller contact (call / WhatsApp)
- [x] Pay Now with Paystack
- [x] Auto-create HaulageJob when order reaches CONFIRMED + has deliveryAddress
- [x] Dispute flag button on order (basic — sends alert to admin)

### P1-PAYMENTS
- [x] Paystack payment init + webhook
- [x] Platform fee (2.05%) deducted on order
- [x] Registration fee (one-time) for HAULAGE and seller roles
- [x] Haulage commission (configurable %) on delivery fee
- [x] PlatformFee record created and tracked

### P1-NOTIFICATIONS
- [x] Notification model + API
- [x] Notification list in app
- [x] Push notifications via Expo (order updates, new jobs, payment confirmed)

### P1-RATINGS
- [x] Submit rating/review after order COMPLETED
- [x] Display seller average rating on profile + product cards
- [x] Haulage provider rating after job DELIVERED

### P1-ADMIN (minimal)
- [x] Web admin panel: users list, orders list, products approval
- [x] Manual verification flag for sellers/farmers
- [x] View all platform fees and transactions
- [x] Dispute queue

---

## PHASE 2 — Growth Features (After MVP Live)

### P2-SMART-MAP
- [ ] Map showing nearby farms/sellers using device GPS
- [ ] Filter map by product, price, verified status
- [ ] Tap pin to view seller/product

### P1-MESSAGES (MOVED TO MVP)
- [x] Conversation model — linked to product + optional order
- [x] Send/receive text messages
- [x] Conversation list (inbox) with unread count
- [x] Message timestamps + read/unread status
- [x] Notifications on new message
- [x] "Ask Seller" button on product detail → opens/creates conversation
- [x] Admin can view conversations for dispute resolution
- [x] Report/block user from conversation
- NOT in MVP: voice, video, group chat, stickers, media beyond images

### P2-VERIFICATION
- [ ] Full KYC flow: upload ID, farm photos, business docs
- [ ] Admin review queue
- [ ] Verified badge awarded after approval

### P2-REWARDS
- [ ] Earn DGR tokens: on order complete, review, referral, signup
- [ ] Token balance display on profile
- [ ] Redeem tokens for platform discounts (future)

### P2-EDUCATION
- [ ] Daily agricultural fact on home screen login
- [ ] Agricultural knowledge base (category articles)
- [ ] "Did You Know?" notification

### P2-ANALYTICS
- [ ] Seller dashboard: revenue chart, top products, order trends
- [ ] Buyer dashboard: total spent, order history analytics
- [ ] Platform admin analytics: GMV, DAU, product demand

### P2-BACKGROUND-JOBS
- [ ] Bull/Redis queue for: notifications, payment events, order reminders
- [ ] Scheduled: daily market price updates, reward calculations

---

## PHASE 3 — Long-Term Ecosystem

### P3-AI
- [ ] AI Agricultural Assistant (GPT-based chat for crop questions)
- [ ] AI product recommendations
- [ ] Price intelligence / demand forecasting
- [ ] Token-gated AI features

### P3-EXPORT
- [ ] International buyer accounts
- [ ] Export product listings
- [ ] Multi-currency support
- [ ] Cross-border logistics

### P3-FINANCE
- [ ] Farmer financial profiles
- [ ] Connect with agricultural lenders
- [ ] Funding application system

### P3-INFRASTRUCTURE
- [ ] Warehousing integration
- [ ] Cold chain logistics
- [ ] Agricultural machinery marketplace
- [ ] Processing facility listings

---

## FEE STRUCTURE (Configured in .env)

| Fee Type | Amount | Trigger | Who Pays |
|---|---|---|---|
| REGISTRATION | ₦2,000 (seller/haulage) | Account activation | New seller / haulage provider |
| TRANSACTION | 2.05% of order value | Order payment | Deducted from order total |
| HAULAGE_COMMISSION | 5% of delivery fee | Job completion | Deducted from haulage payout |
| LISTING (future) | TBD | Product publish | Seller |

Buyers pay no registration or transaction fees in MVP.
Farmers pay registration fee once on account activation.
Haulage providers pay registration fee + 5% commission per job.

---

## CURRENT BUILD STATUS — MVP COMPLETE ✅

> All Phase 1 items are done. The platform is ready for deployment and live user testing.

### Backend Modules
| Module | Status |
|---|---|
| Auth (register, login, OTP, JWT, refresh, reset) | ✅ Complete |
| Users (profile, farmer/buyer profile, push token) | ✅ Complete |
| Marketplace (products, search, near-me, save, verified badge) | ✅ Complete |
| Categories | ✅ Complete |
| Orders (full lifecycle + auto HaulageJob + notifications) | ✅ Complete |
| Payments (Paystack + webhook + transaction fee + notifications) | ✅ Complete |
| Notifications (CRUD + Expo Push API) | ✅ Complete |
| Reviews (order reviews + haulage job ratings, avg recalc) | ✅ Complete |
| Upload (images via Cloudinary) | ✅ Complete |
| SMS (Termii OTP) | ✅ Complete |
| Fees (registration, haulage commission, transaction) | ✅ Complete |
| Haulage (jobs, apply, award, complete, commission) | ✅ Complete |
| Admin (users, products, orders, fees, disputes, verified badge) | ✅ Complete |
| Messages (conversations, send/receive, read status, report) | ✅ Complete |

### Mobile Screens
| Screen | Status |
|---|---|
| Splash, Onboarding | ✅ Complete |
| Login, Register, OTP, ForgotPassword | ✅ Complete |
| HaulageProfileSetup | ✅ Complete |
| RegistrationFee (Paystack) | ✅ Complete |
| Home | ✅ Complete |
| Market (search, filters, Near Me GPS, verified badge) | ✅ Complete |
| Product detail | ✅ Complete |
| Create listing | ✅ Complete |
| Cart + checkout | ✅ Complete |
| Orders list + detail (timeline, pay now, contacts) | ✅ Complete |
| Rate & Review (seller + haulage provider) | ✅ Complete |
| Dispute flag (on order detail) | ✅ Complete |
| Seller Dashboard | ✅ Complete |
| Haulage Provider Dashboard | ✅ Complete |
| Saved Products | ✅ Complete |
| Profile + edit | ✅ Complete |
| Haulage Jobs (browse, apply, filter by state) | ✅ Complete |
| Messages — Inbox + Chat + Ask Seller | ✅ Complete |
| Push notification registration | ✅ Complete |
| Smart Map | ⚠️ Phase 2 stub |

### Admin Web Panel (admin/index.html)
| Component | Status |
|---|---|
| Login (ADMIN role only, JWT) | ✅ Complete |
| Dashboard stats (users, orders, revenue, fees, disputes) | ✅ Complete |
| Users list — search, filter by role/status | ✅ Complete |
| User status — suspend / reactivate | ✅ Complete |
| Verified badge — grant / revoke | ✅ Complete |
| Products list — approve / pause with reason | ✅ Complete |
| Orders list — search, filter by status | ✅ Complete |
| Fees list — filter by type/status, summary breakdown | ✅ Complete |
| Dispute queue — resolve: Complete / Refund / Cancel | ✅ Complete |

### Schema (Prisma)
| Model | Status |
|---|---|
| User, FarmerProfile, BuyerProfile | ✅ Complete |
| HaulageProfile | ✅ Complete (needs migration) |
| Product, Category, SavedProduct | ✅ Complete |
| Order, OrderItem, Payment | ✅ Complete |
| HaulageJob, HaulageApplication | ✅ Complete (needs migration) |
| PlatformFee | ✅ Complete (needs migration) |
| Notification, Review, RewardWallet | ✅ Complete |
| Conversation, Message | ✅ Complete |
| MarketPrice, AuditLog, Verification | ✅ Complete |

### Landing Page
| Component | Status |
|---|---|
| Hero + early access forms (4 roles) | ✅ Complete |
| Founder page | ✅ Complete |
| Google Sheets form collector | ✅ Complete |
| Mobile responsive | ✅ Complete |
| SEO / OG tags | ✅ Complete |

---

## NEXT STEPS — Post-MVP Deployment Checklist

### Before Go-Live
1. **Run DB migrations** — `npx prisma migrate dev` (HaulageProfile, HaulageJob, PlatformFee models need migration)
2. **Set production .env** — PAYSTACK_SECRET_KEY, TERMII_API_KEY, DATABASE_URL, JWT_SECRET, CLOUDINARY_*
3. **Seed categories** — run `npx prisma db seed` to populate category data
4. **Deploy backend** — Koyeb/Railway (Dockerfile + koyeb.yaml already present)
5. **Build mobile app** — `eas build --platform all` (eas.json configured)
6. **Submit to stores** — Google Play + Apple App Store
7. **Point admin panel** at production API URL

### Phase 2 Priorities (after first users)
- Smart Map (GPS map view of nearby farms — currently stub)
- Full KYC verification flow (ID upload → admin review queue)
- DGR token rewards (earn on order complete, review, referral)
- Seller analytics dashboard (revenue chart, top products)
- Bull/Redis background job queue (push batch, reminders)
- Agricultural education content

---

## PHASE 1 COMPLETION LOG

All Phase 1 items are complete. Below is the full build log for reference.

### Session 1 — Core infrastructure
- Auth, Users, Marketplace, Categories, Orders, Payments, Notifications, SMS, Upload, Fees, Haulage, Messages backend modules
- All mobile screens: Splash → Home → Market → Orders → Profile → Haulage → Messages
- Landing page + Founder page

### Session 2 — Push, Admin, Verified Badge
- PushService (Expo Push API) — fires on all order/payment/haulage events
- NotificationsService updated to create DB record + send push atomically
- OrdersService wired for status-transition notifications + haulage provider broadcast
- PaymentsService sends buyer + seller payment-confirmed notifications
- AdminModule — full backend (stats, users, products, orders, fees, disputes, verified badge)
- MarketplaceService — `isVerified` flag computed from `identityStatus === VERIFIED`
- Admin web panel (admin/index.html) — single-file SPA, no build step

### Session 3 — MVP Completion
- HaulageProviderDashboardScreen — active jobs, mark delivered, earnings estimate, application history
- ReviewsModule (backend) — handles order reviews + haulage job ratings, recalculates provider avg
- RateReviewScreen — updated to use reviewsApi, supports haulage-specific flow
- OrderDetailScreen — "Rate the Delivery Driver" button when haulage job is DELIVERED
- MarketScreen — Near Me GPS filter using expo-location, haversine distance sort, radius cycle button
- Backend marketplace — lat/lng/radiusKm params, haversineKm(), distance returned per product
- ProductCard — distanceKm prop, auto-formats "2.3km away"

