'use client';

import type { CSSProperties } from 'react';
import { Stack, Table } from '@mantine/core';
import { ParsedProfile } from './armyParser';

export function renderInlineMarkdown(text: string) {
  if (!text) return null;
  const cleaned = text.replace(/\^\^/g, '');
  const parts = cleaned.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="gts-army-markdown-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function FormattedRuleText({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  return (
    <Stack gap={2} mt={2}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const indentMatch = line.match(/^(\s*)/);
        const indentLevel = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;
        const isBullet =
          trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
        const content = isBullet ? trimmed.slice(2) : trimmed;

        return (
          <div
            key={idx}
            className="gts-army-rule-line"
            style={
              {
                '--indent-level': indentLevel,
                '--bullet-offset': isBullet ? '8px' : '0px',
              } as CSSProperties
            }
          >
            {isBullet && <span className="gts-army-rule-bullet">•</span>}
            {renderInlineMarkdown(content)}
          </div>
        );
      })}
    </Stack>
  );
}

const LEFT_ALIGNED_COLS = new Set([
  'Keywords',
  'Abilities',
  'Special Rules',
  'Traits',
  'Notes',
  'Type',
  'Troop Type',
  'Access Points',
]);

export function ArmyStatTablesBySchema({
  profiles,
  defaultTitle,
  showCount = false,
}: {
  profiles: ParsedProfile[];
  defaultTitle: string;
  showCount?: boolean;
}) {
  if (!profiles || profiles.length === 0) return null;

  const groups = new Map<string, { title: string; cols: string[]; items: ParsedProfile[] }>();
  profiles.forEach((p) => {
    const cols: string[] = (p.characteristics || []).map((c) => c.name);
    if (cols.length === 0) return;
    const sig = cols.join('|');
    if (!groups.has(sig)) {
      const title =
        p.typeName && !p.typeName.toLowerCase().includes('weapon') ? p.typeName : defaultTitle;
      groups.set(sig, { title, cols, items: [] });
    }
    groups.get(sig)!.items.push(p);
  });

  return (
    <>
      {Array.from(groups.values()).map((grp, idx) => (
        <Table.ScrollContainer key={idx} minWidth={420}>
          <Table
            mb="md"
            withRowBorders={true}
            classNames={{
              thead: 'gts-army-table-head',
              th: 'gts-army-table-th',
              td: 'gts-army-table-td',
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th ta="left">{grp.title}</Table.Th>
                {grp.cols.map((col) => {
                  const isLeft = LEFT_ALIGNED_COLS.has(col);
                  return (
                    <Table.Th key={col} ta={isLeft ? 'left' : 'center'}>
                      {col}
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {grp.items.map((prof) => (
                <Table.Tr key={`${prof.id}-${prof.name}`}>
                  <Table.Td fw={700}>
                    {prof.name}
                    {showCount && (prof._count || 1) > 1 ? ` (x${prof._count})` : ''}
                  </Table.Td>
                  {grp.cols.map((col) => {
                    const rawVal = prof.characteristics?.find((c) => c.name === col)?.$text || '-';
                    const isLeft = LEFT_ALIGNED_COLS.has(col);
                    return (
                      <Table.Td
                        key={col}
                        ta={isLeft ? 'left' : 'center'}
                        fw={!isLeft && defaultTitle === 'Model' ? 700 : 400}
                        className={isLeft ? 'gts-army-stat-cell-notes' : 'gts-army-stat-cell-val'}
                      >
                        {renderInlineMarkdown(String(rawVal))}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ))}
    </>
  );
}