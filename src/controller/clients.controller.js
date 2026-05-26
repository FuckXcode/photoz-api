const { listClients, createClient, deleteClient } = require('../service/repository.service');
const { deleteStorageObject } = require('../utils/storage');
const { success, fail } = require('../utils/response');
const ErrorCode = require('../constants/error-codes');

class ClientsController {
  async list(ctx) {
    ctx.body = success(await listClients(ctx.user.id));
  }

  async create(ctx) {
    const body = ctx.request.body;
    if (!body.name?.trim()) {
      ctx.body = fail(ErrorCode.INVALID_PARAMS, '客户名称不能为空');
      return;
    }
    ctx.body = success(await createClient(ctx.user.id, body));
  }

  async remove(ctx) {
    const { id } = ctx.params;
    const objectKeys = await deleteClient(ctx.user.id, id);
    if (objectKeys === null) {
      ctx.body = fail(ErrorCode.NOT_FOUND, '客户不存在');
      return;
    }
    await Promise.allSettled(objectKeys.map((key) => deleteStorageObject(key)));
    ctx.body = success({ ok: true });
  }
}

module.exports = new ClientsController();
