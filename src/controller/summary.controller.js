const { getDashboardSummary } = require('../service/repository.service');
const { success } = require('../utils/response');

class SummaryController {
  async getSummary(ctx) {
    ctx.body = success(await getDashboardSummary(ctx.user.id));
  }
}

module.exports = new SummaryController();
