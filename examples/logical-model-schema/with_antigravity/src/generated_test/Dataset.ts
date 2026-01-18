/**
 * データセットの情報
 */
import { Contributor } from './Contributor';

export interface Dataset {
  /** データセットID */
  dataset_id?: string;
  /** データセット名 */
  name: string;
  /** 公開設定 */
  access_type?: 'Public' | 'Private';
  /** データセットの取得者又は収集者 */
  collected_by: Contributor;
  /** データセットの管理責任者 */
  managed_by: Contributor | null;
}
