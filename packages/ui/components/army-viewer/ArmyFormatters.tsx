'use client';

import { Stack, Table } from '@mantine/core';
import { ParsedProfile } from './armyParser';

export function renderInlineMarkdown(text: string) {
  if (!text) return null;
  const cleaned = text.replace(/\^\^/g, '');
  const parts = cleaned.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} style={{ color: '#e9ecef', fontWeight: 700 }}>
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
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
        const content = isBullet ? trimmed.slice(2) : trimmed;

        return (
          <div
            key={idx}
            style={{
              paddingLeft: `${indentLevel * 12 + (isBullet ? 8 : 0)}px`,
              fontSize: '12px',
              color: '#adb5bd',
              lineHeight: 1.45,
            }}
          >
            {isBullet && <span style={{ color: '#e0282b', marginRight: 6 }}>•</span>}
            {renderInlineMarkdown(content)}
          </div>
        );
      })}
    </Stack>
  );
}

const LEFT_ALIGNED_COLS = new Set([
  'Keywords', 'Abilities', 'Special Rules', 'Traits', 'Notes', 'Type', 'Troop Type', 'Access Points'
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
      const title = p.typeName && !p.typeName.toLowerCase().includes('weapon') ? p.typeName : defaultTitle;
      groups.set(sig, { title, cols, items: [] });
    }
    groups.get(sig)!.items.push(p);
  });

  return (
    <>
      {Array.from(groups.values()).map((grp, idx) => (
        <Table
          key={idx}
          mb="md"
          withRowBorders={true}
          styles={{
            th: { color: '#a6a7ab', fontSize: '11px', borderBottom: '1px solid #354b60', padding: '6px 8px' },
            td: { color: 'white', fontSize: '13px', borderColor: '#1a1d24', padding: '6px 8px' },
          }}
        >
          <Table.Thead style={{ backgroundColor: '#1a1d24' }}>
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
                      c={isLeft ? 'gray.4' : 'white'}
                      style={isLeft ? { fontSize: '11px' } : undefined}
                    >
                      {renderInlineMarkdown(String(rawVal))}
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ))}
    </>
  );
}