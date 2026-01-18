// Generated from Logical Model: ResearchDataManagementPlan_LogicalModel
// Schema Version: 1.0

// ==========================================
// Entities (Nodes)
// ==========================================

/**
 * DMP自体の作成・更新に関するメタデータ
 */
export interface DMPMetadata {
  /**
 * DMP作成年月日
 */
  created_date: Date;
  /**
 * DMP最終更新年月日
 */
  last_updated_date: Date;
}

/**
 * データマネジメントの対象となる研究プロジェクト
 */
export interface Project {
  /**
 * 研究課題番号
 */
  project_number?: string;
}

/**
 * プロジェクトに関与する研究者およびスタッフ
 */
export interface Contributor {
  /**
 * 本計画書内通し番号
 */
  contributor_id?: string;
  /**
 * 氏名
 */
  name: string;
  /**
 * プロジェクト内の役割
 */
  role_in_project?: "Principal Investigator" | "Co-Investigator" | "Data Collector" | "Data Manager";
}

/**
 * プロジェクトで生成・収集される個別のデータセット
 */
export interface Dataset {
  /**
 * No.
 */
  dataset_no?: number;
  /**
 * 研究データの名称
 */
  title: string;
  /**
 * 研究データの公開・提供方針
 */
  access_policy?: "公開" | "共有" | "非共有・非公開";
}

// ==========================================
// Relationships (Edges)
// Treated as independent interfaces for Property Graph capability
// ==========================================

/**
 * @note Cardinality: 1:1
 */
export interface Project_HasMetadata_DMPMetadata {
  /** Relationship Type Identifier */
  type: "has_metadata";
  /** Source Entity ID (Project) */
  source_id: string;
  /** Target Entity ID (DMPMetadata) */
  target_id: string;
}

/**
 * @note Cardinality: 1:N
 */
export interface Project_HasContributors_Contributor {
  /** Relationship Type Identifier */
  type: "has_contributors";
  /** Source Entity ID (Project) */
  source_id: string;
  /** Target Entity ID (Contributor) */
  target_id: string;
}

/**
 * @note Cardinality: 1:N
 */
export interface Project_HasDatasets_Dataset {
  /** Relationship Type Identifier */
  type: "has_datasets";
  /** Source Entity ID (Project) */
  source_id: string;
  /** Target Entity ID (Dataset) */
  target_id: number;
}

/**
 * 研究データの取得者又は収集者
 * @note Cardinality: 1:1
 */
export interface Dataset_CollectedBy_Contributor {
  /** Relationship Type Identifier */
  type: "collected_by";
  /** Source Entity ID (Dataset) */
  source_id: number;
  /** Target Entity ID (Contributor) */
  target_id: string;
}

/**
 * 研究データの管理者
 * @note Cardinality: 0:1
 */
export interface Dataset_ManagedBy_Contributor {
  /** Relationship Type Identifier */
  type: "managed_by";
  /** Source Entity ID (Dataset) */
  source_id: number;
  /** Target Entity ID (Contributor) */
  target_id: string;
}
