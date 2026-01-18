/**
 * プロジェクトへの貢献者の情報
 */
export interface Contributor {
  /** メンバーID */
  contributor_id?: string;
  /** 氏名 */
  name: string;
  /** 所属・役職 */
  affiliation_and_title?: string;
  /** プロジェクト内の役割 */
  role_in_project?: 'Project Leader (プロジェクトリーダー)' | 'Project Member (プロジェクトメンバー)' | 'Data Collector (データセットの取得者又は収集者)' | 'Data Manager (データセットの管理責任者)';
}
