import { appDataSourceRead, appDataSourceReadWrite } from '../data-source.js';
import { GlobalBlockedApp } from '../entities/GlobalBlockedApp.js';

export class GlobalBlockedAppService {
  static async listAll(): Promise<GlobalBlockedApp[]> {
    const repo = appDataSourceRead.getRepository(GlobalBlockedApp);
    return repo.find({ order: { createdAt: 'DESC' } });
  }

  static async listAppIds(): Promise<string[]> {
    const repo = appDataSourceRead.getRepository(GlobalBlockedApp);
    const rows = await repo.find({ select: ['appId'] });
    return rows.map((r) => r.appId);
  }

  static async getByAppId(appId: string): Promise<GlobalBlockedApp | null> {
    const repo = appDataSourceRead.getRepository(GlobalBlockedApp);
    return repo.findOne({ where: { appId } });
  }

  static async isBlocked(appId: string): Promise<boolean> {
    return (await this.getByAppId(appId)) !== null;
  }

  static async addOrUpdate(appId: string, note: string | null): Promise<GlobalBlockedApp> {
    const repo = appDataSourceReadWrite.getRepository(GlobalBlockedApp);
    const existing = await repo.findOne({ where: { appId } });
    if (existing !== null) {
      existing.note = note;
      return repo.save(existing);
    }
    return repo.save(
      repo.create({
        appId,
        note,
      })
    );
  }

  static async deleteByAppId(appId: string): Promise<boolean> {
    const repo = appDataSourceReadWrite.getRepository(GlobalBlockedApp);
    const result = await repo.delete({ appId });
    return (result.affected ?? 0) > 0;
  }
}
