const dbService = require('../services/dbService');

const getReport = (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Simulate recurring billing each time reports are requested
    Promise.resolve()
      .then(() => dbService.processRecurringInvoices(userId))
      .then(() => Promise.all([
        dbService.listInvoicesByUser(userId),
        dbService.listPaymentsByUser(userId),
        dbService.listCustomersByUser(userId),
      ]))
      .then(([invoices, payments, customers]) => {

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = invoices
          .filter((inv) => inv.status !== 'PAID')
          .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const now = new Date();
        const currentYear = now.getFullYear();
        const monthlyStats = Array.from({ length: 12 }).map((_, idx) => ({
          month: idx + 1,
          revenue: 0,
        }));

        payments.forEach((p) => {
          const d = new Date(p.paymentDate);
          if (d.getFullYear() === currentYear) {
            const m = d.getMonth(); // 0-based
            monthlyStats[m].revenue += p.amount;
          }
        });

        res.json({
          totalRevenue,
          totalCustomers: customers.length,
          pendingAmount,
          monthlyStats,
        });
      })
      .catch((err) => next(err));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReport,
};

