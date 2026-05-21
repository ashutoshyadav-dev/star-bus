import api from './client'

/* ─── Customer wallet endpoints ────────────────────────────────────────────
 *  Controller: GET /wallet                → getWallet()
 *              POST /wallet/topup         → topUp()
 *              GET /wallet/statement      → getStatement() (paginated)
 *
 *  Permissions required (set by @RequirePermission):
 *    wallet:view   — GET /wallet, GET /wallet/statement
 *    wallet:topup  — POST /wallet/topup
 * ─────────────────────────────────────────────────────────────────────── */
export const walletApi = {
  /** Fetch the authenticated user's wallet balance + metadata */
  get: () => api.get('/wallet'),

  /**
   * Top up the wallet.
   * Body: { amount: BigDecimal, gatewayPaymentId?: string, description?: string }
   * gatewayPaymentId must come from a successful Razorpay payment for the top-up amount.
   */
  topUp: (data) => api.post('/wallet/topup', data),

  /**
   * Paginated wallet statement (most recent first).
   * params: { page: number, size: number }
   * Maps to Spring Pageable — Spring Boot reads `page` and `size` query params automatically.
   */
  getStatement: (params) => api.get('/wallet/statement', { params }),
}

/* ─── Admin wallet endpoints ────────────────────────────────────────────────
 *  These require admin-level permissions.
 *  You will need to add these endpoints to WalletController.java — see comments.
 *
 *  Suggested controller additions:
 *
 *  @GetMapping("/admin/user/{userId}")
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<WalletResponse>> getWalletByUserId(@PathVariable UUID userId)
 *
 *  @PostMapping("/admin/user/{userId}/credit")
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<WalletResponse>> adminCredit(
 *      @PathVariable UUID userId, @RequestBody AdminWalletAdjustRequest req)
 *  // WalletTransactionType: ADMIN_CREDIT
 *
 *  @PostMapping("/admin/user/{userId}/debit")
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<WalletResponse>> adminDebit(
 *      @PathVariable UUID userId, @RequestBody AdminWalletAdjustRequest req)
 *  // WalletTransactionType: ADMIN_DEBIT
 *
 *  @PostMapping("/admin/user/{userId}/freeze")
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<WalletResponse>> freezeWallet(@PathVariable UUID userId)
 *
 *  @PostMapping("/admin/user/{userId}/unfreeze")
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<WalletResponse>> unfreezeWallet(@PathVariable UUID userId)
 *
 *  @GetMapping("/admin/user/{userId}/statement")
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<Page<WalletTransactionResponse>>> getStatementByUserId(
 *      @PathVariable UUID userId, Pageable pageable)
 *
 *  @GetMapping("/admin/all")          ← NEW: list all wallets (paginated)
 *  @PreAuthorize("hasRole('ADMIN')")
 *  public ResponseEntity<ApiResponse<Page<WalletResponse>>> getAllWallets(Pageable pageable)
 *
 *  Service methods to add to WalletService.java:
 *    adminCredit(UUID userId, BigDecimal amount, String reason) — ADMIN_CREDIT tx
 *    adminDebit(UUID userId, BigDecimal amount, String reason)  — ADMIN_DEBIT  tx
 *    freezeWallet(UUID userId)
 *    unfreezeWallet(UUID userId)
 *    getWalletByUserId(UUID userId)        — same as getWallet() but exposed to admin
 *    getStatementByUserId(UUID userId, Pageable) — admin reads any user's statement
 *    getAllWallets(Pageable)               — for the admin list view
 * ─────────────────────────────────────────────────────────────────────── */
export const adminWalletApi = {
  /** List all wallets (paginated). params: { page, size } */
  getAll: (params) => api.get('/wallet/admin/all', { params }),

  /** Fetch a specific user's wallet by their UUID */
  getByUserId: (userId) => api.get(`/wallet/admin/user/${userId}`),

  /** Fetch a specific user's wallet statement. params: { page, size } */
  getStatementByUserId: (userId, params) =>
    api.get(`/wallet/admin/user/${userId}/statement`, { params }),

  /**
   * Credit (add) money to a user's wallet.
   * Body: { amount: BigDecimal, reason: string }
   * Creates a WalletTransaction with type ADMIN_CREDIT.
   */
  credit: (userId, data) => api.post(`/wallet/admin/user/${userId}/credit`, data),

  /**
   * Debit (remove) money from a user's wallet.
   * Body: { amount: BigDecimal, reason: string }
   * Creates a WalletTransaction with type ADMIN_DEBIT.
   * Will throw InsufficientWalletBalanceException if balance < amount.
   */
  debit: (userId, data) => api.post(`/wallet/admin/user/${userId}/debit`, data),

  /** Freeze the wallet — debitForBooking() will throw WalletFrozenException */
  freeze: (userId) => api.post(`/wallet/admin/user/${userId}/freeze`),

  /** Unfreeze the wallet */
  unfreeze: (userId) => api.post(`/wallet/admin/user/${userId}/unfreeze`),
}