 

import {
  SearchInput,
  SearchOutput,
  ZSearchOutput,
  RESOURCE_TYPE,
} from '@/contracts/query/schema-v1';
import { prisma } from '@/lib/prisma';

// ==========  FTS Index Management ==========

const createFTS = async () => {
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_project_fts;`),
    prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_board_fts;`),
    prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_sprint_fts;`),
    prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_issue_fts;`),
  ]);
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_project_fts
      ON "projects" USING GIN (
        to_tsvector('english', coalesce("name",'') || ' ' || coalesce("description",''))
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_board_fts
      ON "boards" USING GIN (
        to_tsvector('english', coalesce("name",'') || ' ' || coalesce("description",''))
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_sprint_fts
      ON "sprints" USING GIN (
        to_tsvector('english', coalesce("name",'') || ' ' || coalesce("description",''))
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_issue_fts
      ON "issues" USING GIN (
        to_tsvector('english', coalesce("summary",'') || ' ' || coalesce("description",''))
      )
    `),
  ]);
};

await createFTS();
// ========================================

type Cursor = { r: number; t: string; id: string };
const encodeCursor = (c: Cursor) => Buffer.from(JSON.stringify(c)).toString('base64url');
const decodeCursor = (s?: string | null): Cursor | null => {
  if (!s) return null;
  try {
    return JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

function buildUrl(row: any) {
  switch (row.type) {
    case 'project':
      return `/projects/${row.id}`;
    case 'board':
      return `/projects/${row.project_id}/boards/${row.id}`;
    case 'sprint':
      return `/projects/${row.project_id}/boards/${row.board_id}/sprints/${row.id}`;
    case 'issue':
      return `/projects/${row.project_id}/issues/${row.id}`;
    default:
      return undefined;
  }
}

function buildBreadcrumbs(row: any) {
  const bc: Array<{ id: string; label: string; href?: string }> = [];
  if (row.project_id && row.project_name) {
    bc.push({ id: row.project_id, label: row.project_name, href: `/projects/${row.project_id}` });
  }
  if (row.board_id && row.board_name) {
    bc.push({
      id: row.board_id,
      label: row.board_name,
      href: `/projects/${row.project_id}/boards/${row.board_id}`,
    });
  }
  if (row.sprint_id && row.sprint_name) {
    bc.push({
      id: row.sprint_id,
      label: row.sprint_name,
      href: `/projects/${row.project_id}/boards/${row.board_id}/sprints/${row.sprint_id}`,
    });
  }
  return bc.length ? bc : undefined;
}

// FIXME: thieu authz
const search = async (input: SearchInput): Promise<SearchOutput> => {
  const q = input.q?.trim();
  if (!q || q.length === 0) return ZSearchOutput.parse({ data: [], meta: { total: 0 } });

  const types = input.filter?.types ?? Object.values(RESOURCE_TYPE);
  const size = input.pagination?.size ?? 10;
  const cursor = decodeCursor(input.pagination?.cursor);

  // Đọc cursor (nếu có)
  const cursorRank = cursor?.r ?? null; // number
  const cursorTime = cursor?.t ?? null; // ISO string
  const cursorRowId = cursor?.id ?? null; // string

  const take = Math.min(100, size) + 1;

  // Query chính: gộp 4 bảng, tính rank FTS, join tối thiểu để dựng breadcrumbs
  // - $1: q (string|null)
  // - $2: limit
  // - $3: cursor.rank (number|null)
  // - $4: cursor.updatedAt (timestamptz|null)
  // - $5: cursor.id (text|null)
  // - $6: types[] (text[])
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
  WITH unioned AS (
    -- PROJECT
    SELECT
      p.id::text              AS id,
      'project'::text         AS type,
      p."name"                AS title,
      p."description"         AS description,
      p."avatar"              AS iconURL,
      p."updated_at"          AS updated_at,
      NULL::text              AS project_id,
      NULL::text              AS project_name,
      NULL::text              AS board_id,
      NULL::text              AS board_name,
      NULL::text              AS sprint_id,
      NULL::text              AS sprint_name,
      CASE WHEN $1 IS NULL THEN 0
           ELSE ts_rank_cd(
             to_tsvector('english', coalesce(p."name",'') || ' ' || coalesce(p."description",'')),
             websearch_to_tsquery('english', $1)
           )
      END AS rank
    FROM "projects" p
    WHERE (
      $1 IS NULL OR
      to_tsvector('english', coalesce(p."name",'') || ' ' || coalesce(p."description",''))
        @@ websearch_to_tsquery('english', $1)
    )

    UNION ALL

    -- BOARD
    SELECT
      b.id::text              AS id,
      'board'::text           AS type,
      b."name"                AS title,
      b."description"         AS description,
      NULL::text              AS iconURL,
      b."updated_at"          AS updated_at,
      p.id::text              AS project_id,
      p."name"                AS project_name,
      NULL::text              AS board_id,
      NULL::text              AS board_name,
      NULL::text              AS sprint_id,
      NULL::text              AS sprint_name,
      CASE WHEN $1 IS NULL THEN 0
           ELSE ts_rank_cd(
             to_tsvector('english', coalesce(b."name",'') || ' ' || coalesce(b."description",'')),
             websearch_to_tsquery('english', $1)
           )
      END AS rank
    FROM "boards" b
    JOIN "projects" p ON p.id = b."project_id"
    WHERE (
      $1 IS NULL OR
      to_tsvector('english', coalesce(b."name",'') || ' ' || coalesce(b."description",''))
        @@ websearch_to_tsquery('english', $1)
    )

    UNION ALL

    -- SPRINT
    SELECT
      s.id::text              AS id,
      'sprint'::text          AS type,
      s."name"                AS title,
      s."description"         AS description,
      NULL::text              AS iconURL,
      s."updated_at"          AS updated_at,
      p.id::text              AS project_id,
      p."name"                AS project_name,
      b.id::text              AS board_id,
      b."name"                AS board_name,
      NULL::text              AS sprint_id,
      NULL::text              AS sprint_name,
      CASE WHEN $1 IS NULL THEN 0
           ELSE ts_rank_cd(
             to_tsvector('english', coalesce(s."name",'') || ' ' || coalesce(s."description",'')),
             websearch_to_tsquery('english', $1)
           )
      END AS rank
    FROM "sprints" s
    JOIN "boards"  b ON b.id = s."board_id"
    JOIN "projects" p ON p.id = b."project_id"
    WHERE (
      $1 IS NULL OR
      to_tsvector('english', coalesce(s."name",'') || ' ' || coalesce(s."description",''))
        @@ websearch_to_tsquery('english', $1)
    )

    UNION ALL

    -- ISSUE (không tham chiếu board/sprint)
    SELECT
      i.id::text              AS id,
      'issue'::text           AS type,
      i."key"                 AS title,
      i."summary"             AS description,
      NULL::text              AS iconURL,
      i."updated_at"          AS updated_at,
      p.id::text              AS project_id,
      p."name"                AS project_name,
      NULL::text              AS board_id,
      NULL::text              AS board_name,
      NULL::text              AS sprint_id,
      NULL::text              AS sprint_name,
      CASE WHEN $1 IS NULL THEN 0
           ELSE ts_rank_cd(
             to_tsvector('english', coalesce(i."summary",'') || ' ' || coalesce(i."description",'')),
             websearch_to_tsquery('english', $1)
           )
      END AS rank
    FROM "issues" i
    JOIN "projects" p ON p.id = i."project_id"
    WHERE (
      $1 IS NULL OR
      to_tsvector('english',
        coalesce(i."key",'') || ' ' || coalesce(i."summary",'') || ' ' || coalesce(i."description",'')
      ) @@ websearch_to_tsquery('english', $1)
    )
  ),
  filtered AS (
    SELECT * FROM unioned
    WHERE (cardinality($6::text[]) = 0 OR type = ANY($6::text[]))
  )
  SELECT *
  FROM filtered f
  WHERE
    -- keyset cursor: (rank DESC, updated_at DESC, id ASC)
    ($3::double precision IS NULL AND $4::timestamptz IS NULL AND $5::text IS NULL)
    OR (
      (f.rank <  $3::double precision)
      OR (f.rank = $3::double precision AND f.updated_at <  $4::timestamptz)
      OR (f.rank = $3::double precision AND f.updated_at = $4::timestamptz AND f.id > $5::text)
    )
  ORDER BY f.rank DESC, f.updated_at DESC, f.id ASC
  LIMIT $2
  `,
    q,
    take,
    cursorRank,
    cursorTime,
    cursorRowId,
    types,
  );

  // Tính total (đếm theo cùng điều kiện, KHÔNG limit)
  const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `
  WITH unioned AS (
    SELECT 'project'::text AS type
    FROM "projects" p
    WHERE (
      $1 IS NULL OR
      to_tsvector('english', coalesce(p."name",'') || ' ' || coalesce(p."description",''))
        @@ websearch_to_tsquery('english', $1)
    )

    UNION ALL

    SELECT 'board'::text
    FROM "boards" b
    WHERE (
      $1 IS NULL OR
      to_tsvector('english', coalesce(b."name",'') || ' ' || coalesce(b."description",''))
        @@ websearch_to_tsquery('english', $1)
    )

    UNION ALL

    SELECT 'sprint'::text
    FROM "sprints" s
    WHERE (
      $1 IS NULL OR
      to_tsvector('english', coalesce(s."name",'') || ' ' || coalesce(s."description",''))
        @@ websearch_to_tsquery('english', $1)
    )

    UNION ALL

    SELECT 'issue'::text
    FROM "issues" i
    WHERE (
      $1 IS NULL OR
      to_tsvector('english',
        coalesce(i."key",'') || ' ' || coalesce(i."summary",'') || ' ' || coalesce(i."description",'')
      ) @@ websearch_to_tsquery('english', $1)
    )
  )
  SELECT COUNT(*)::bigint AS count
  FROM unioned
  WHERE (cardinality($2::text[]) = 0 OR type = ANY($2::text[]))
  `,
    q,
    types,
  );

  // Xử lý size + cursor
  let nextCursor: string | undefined;
  let slice = rows;
  if (rows.length > size) {
    const next = rows[size];
    nextCursor = encodeCursor({
      r: Number(next.rank ?? 0),
      t: new Date(next.updated_at).toISOString(),
      id: next.id,
    });
    slice = rows.slice(0, size);
  }

  // Map dữ liệu -> ZSearchItem
  const data = slice.map((r) => {
    const breadcrumbs = buildBreadcrumbs(r);

    // id theo format `${type}:${id}`
    const id = `${r.type}:${r.id}`;
    const url = buildUrl(r);

    // snippet: ở mức cơ bản trả về description rút gọn; muốn highlight có thể làm thêm ở app layer
    const snippet = r.description ? String(r.description).slice(0, 180) : undefined;

    const item: any = {
      id,
      type: r.type,
      title: r.title ?? '',
      description: r.description ?? undefined,
      breadcrumbs,
      snippet,
      url,
      iconURL: r.iconURL ?? undefined,
    };

    // Đính kèm data đặc thù (tùy bạn muốn gì)
    if (r.type === 'issue')
      item.issue = {
        id: r.id,
        projectId: r.project_id,
        boardId: r.board_id,
        sprintId: r.sprint_id,
      };
    if (r.type === 'project') item.project = { id: r.id };
    if (r.type === 'board') item.board = { id: r.id, projectId: r.project_id };
    if (r.type === 'sprint')
      item.sprint = { id: r.id, projectId: r.project_id, boardId: r.board_id };

    return item;
  });

  const output = {
    data,
    meta: { total: Number(count), cursor: nextCursor },
  };

  // Bảo đảm khớp schema trả về
  const parsed = ZSearchOutput.parse(output);
  return parsed;
};

export { search };
