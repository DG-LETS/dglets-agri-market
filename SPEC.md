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
- [ ] Registration fee charge on account activation (Paystack)
- [ ] Post-registration profile setup screen for HAULAGE role

### P1-FARMER
- [x] Farmer profile creation
- [x] Create / edit / delete product listings
- [x] Upload product images
- [x] Set price, quantity, unit, state/LGA
- [x] View own orders (selling tab)
- [x] Accept / reject / update order status
- [ ] Seller dashboard: overview of sales, revenue, pending orders
- [ ] Basic seller verification badge (admin sets verified flag)

### P1-BUYER
- [x] Browse / search products
- [x] Filter by category, state, price
- [x] View product detail and seller profile
- [x] Add to cart and place order
- [x] Payment via Paystack
- [x] Order tracking (status timeline)
- [x] Confirm receipt
- [ ] Save / wishlist products (UI exists, needs display screen)
- [ ] Rate and review after order completes

### P1-MARKETPLACE
- [x] Product search with keyword + filters
- [x] Category browsing
- [x] Market prices ticker
- [x] Product save/unsave
- [ ] Verified seller badge visible on product cards
- [ ] "Near me" filter using device location

### P1-LOGISTICS
- [x] HAULAGE role registration
- [x] Haulage Jobs screen (UI built)
- [x] Apply for delivery job
- [ ] HaulageProfile setup screen (coverage states, vehicle type, capacity)
- [ ] Backend: HaulageModule (list jobs, apply, award, complete)
- [ ] Haulage commission deducted at job completion
- [ ] Haulage provider dashboard (active jobs, completed, earnings)

### P1-ORDERS
- [x] Full order lifecycle (PENDING → COMPLETED)
- [x] Order detail with timeline
- [x] Buyer + seller contact (call / WhatsApp)
- [x] Pay Now with Paystack
- [ ] Auto-create HaulageJob when order reaches CONFIRMED + has deliveryAddress
- [ ] Dispute flag button on order (basic — sends alert to admin)

### P1-PAYMENTS
- [x] Paystack payment init + webhook
- [x] Platform fee (2.05%) deducted on order
- [ ] Registration fee (one-time) for HAULAGE and seller roles
- [ ] Haulage commission (configurable %) on delivery fee
- [ ] PlatformFee record created and tracked

### P1-NOTIFICATIONS
- [x] Notification model + API
- [x] Notification list in app
- [ ] Push notifications via Expo (order updates, new jobs, payment confirmed)

### P1-RATINGS
- [ ] Submit rating/review after order COMPLETED
- [ ] Display seller average rating on profile + product cards
- [ ] Haulage provider rating after job DELIVERED

### P1-ADMIN (minimal)
- [ ] Web admin panel: users list, orders list, products approval
- [ ] Manual verification flag for sellers/farmers
- [ ] View all platform fees and transactions
- [ ] Dispute queue

---

## PHASE 2 — Growth Features (After MVP Live)

### P2-SMART-MAP
- [ ] Map showing nearby farms/sellers using device GPS
- [ ] Filter map by product, price, verified status
- [ ] Tap pin to view seller/product

### P1-MESSAGES (MOVED TO MVP)
- [ ] Conversation model — linked to product + optional order
- [ ] Send/receive text messages
- [ ] Conversation list (inbox) with unread count
- [ ] Message timestamps + read/unread status
- [ ] Notifications on new message
- [ ] "Ask Seller" button on product detail → opens/creates conversation
- [ ] Admin can view conversations for dispute resolution
- [ ] Report/block user from conversation
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

## CURRENT BUILD STATUS (as of session start)

### Backend Modules
| Module | Status |
|---|---|
| Auth (register, login, OTP, JWT) | ✅ Complete |
| Users (profile, farmer profile, push token) | ✅ Complete |
| Marketplace (products, search, save, verified badge) | ✅ Complete |
| Categories | ✅ Complete |
| Orders (full lifecycle + auto HaulageJob) | ✅ Complete |
| Payments (Paystack + transaction fee record) | ✅ Complete |
| Notifications (CRUD) | ✅ Complete |
| Upload (images) | ✅ Complete |
| SMS (Termii) | ✅ Complete |
| Fees (registration, haulage commission, transaction) | ✅ Complete |
| Haulage (jobs, apply, award, complete) | ✅ Complete |
| Dispute | ⚠️ WhatsApp redirect (admin panel needed for full flow) |
| Admin | ❌ Not built |

### Mobile Screens
| Screen | Status |
|---|---|
| Splash, Onboarding | ✅ Complete |
| Login, Register, OTP, ForgotPassword | ✅ Complete |
| HaulageProfileSetup | ✅ Complete |
| RegistrationFee (Paystack) | ✅ Complete |
| Home | ✅ Complete |
| Market browse + filters + verified badge | ✅ Complete |
| Product detail | ✅ Complete |
| Create listing | ✅ Complete |
| Cart + checkout | ✅ Complete |
| Orders list + detail | ✅ Complete |
| Rate & Review | ✅ Complete |
| Dispute flag (on order detail) | ✅ Complete |
| Seller Dashboard | ✅ Complete |
| Saved Products | ✅ Complete |
| Profile + edit | ✅ Complete |
| Haulage Jobs | ✅ Complete |
| Messages | ✅ Complete (Inbox + Chat + Ask Seller) |
| Smart Map | ⚠️ Stub only |

### Schema (Prisma)
| Model | Status |
|---|---|
| User, FarmerProfile, BuyerProfile | ✅ Complete |
| Product, Category, SavedProduct | ✅ Complete |
| Order, OrderItem, Payment | ✅ Complete |
| Notification, Review, RewardWallet | ✅ Complete |
| MarketPrice, AuditLog | ✅ Complete |
| HaulageProfile | ✅ Added (needs migration) |
| HaulageJob, HaulageApplication | ✅ Added (needs migration) |
| PlatformFee | ✅ Added (needs migration) |

### Landing Page
| Component | Status |
|---|---|
| Hero + early access forms (4 roles) | ✅ Complete |
| Founder page | ✅ Complete |
| Google Sheets form collector | ✅ Complete |
| Mobile responsive | ✅ Fixed |
| SEO / OG tags | ✅ Complete |

---

## NEXT BUILD SEQUENCE (MVP remaining)

1. **Fee config in .env** — add REGISTRATION_FEE_SELLER, HAULAGE_COMMISSION_RATE
2. **PlatformFee service** — createRegistrationFee(), chargeHaulageCommission()
3. **Auth: charge registration fee on OTP verify** for seller/haulage roles
4. **HaulageModule (backend)** — jobs listing, apply, award, complete
5. **HaulageProfileSetupScreen (mobile)** — post-registration for HAULAGE role
6. **Registration fee payment screen (mobile)** — Paystack for activation
7. **Auto-create HaulageJob** when order confirmed with delivery address
8. **Rating/Review submit screen** — triggered after order COMPLETED
9. **Seller dashboard screen** — sales overview, revenue, pending orders
10. **Push notifications** — Expo push token registration + send on order events
11. **Verified badge** — admin sets verified flag, shows on product cards
12. **Saved products screen** — display wishlist
13. **Dispute flag** — button on order detail sends alert
14. **Minimal admin web panel** — users, orders, products, fees

