import fs from 'fs';
import path from 'path';

export function startBackupCron(): void {
  const backupDir = process.env.BACKUP_DIR || './backups';
  const dbPath = process.env.DB_PATH || './data/repai.db';

  const resolvedDbPath = path.resolve(process.cwd(), dbPath);
  const resolvedBackupDir = path.resolve(process.cwd(), backupDir);

  if (!fs.existsSync(resolvedBackupDir)) {
    fs.mkdirSync(resolvedBackupDir, { recursive: true });
  }

  function performBackup() {
    try {
      if (!fs.existsSync(resolvedDbPath)) {
        console.warn(`[Backup] DB file does not exist yet at ${resolvedDbPath}`);
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const backupFilePath = path.join(resolvedBackupDir, `repai-backup-${dateStr}.sqlite`);

      fs.copyFileSync(resolvedDbPath, backupFilePath);
      console.log(`[Backup] Automated daily database backup saved to: ${backupFilePath}`);
    } catch (err: any) {
      console.error(`[Backup Error] Failed to create daily backup:`, err.message);
    }
  }

  // Run initial backup 5 seconds after startup
  setTimeout(performBackup, 5000);

  // Repeat backup every 24 hours (86,400,000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(performBackup, TWENTY_FOUR_HOURS);
}
