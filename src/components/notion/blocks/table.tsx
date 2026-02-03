import { NotionRichText } from "../notion-rich-text";
import type { TableBlock, TableRowBlock } from "@/types/notion-blocks";

interface NotionTableProps {
  block: TableBlock;
}

export function NotionTable({ block }: NotionTableProps) {
  const { has_column_header, has_row_header } = block.table;
  const rows = (block.children ?? []) as TableRowBlock[];

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-border rounded-lg">
        <tbody>
          {rows.map((row, rowIndex) => {
            const isHeaderRow = has_column_header && rowIndex === 0;

            return (
              <tr
                key={row.id}
                className={isHeaderRow ? "bg-muted/50" : ""}
              >
                {row.table_row.cells.map((cell, cellIndex) => {
                  const isHeaderCell = has_row_header && cellIndex === 0;
                  const CellTag = isHeaderRow || isHeaderCell ? "th" : "td";

                  return (
                    <CellTag
                      key={cellIndex}
                      className={`
                        border border-border px-4 py-2 text-sm
                        ${isHeaderRow || isHeaderCell ? "font-medium bg-muted/50" : ""}
                        ${isHeaderRow ? "text-left" : ""}
                      `}
                    >
                      <NotionRichText richText={cell} />
                    </CellTag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
