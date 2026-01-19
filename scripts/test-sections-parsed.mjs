import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

// .env 파일 직접 파싱
const envFile = readFileSync('.env', 'utf8');
for (const line of envFile.split('\n')) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
}

const pageId = '2edffd33-6b70-80d8-9c6a-c761b6f718f2';
const client = new Client({ auth: process.env.NOTION_API_KEY });

// lib/notion-blocks.ts의 로직을 복제
const SECTION_MAPPING = {
  "1. 미션 소개": "introduction",
  "2. 과제 목표": "objective",
  "3. 최종 결과물": "result",
  "4. 목표 수행 시간": "timeGoal",
  "5. 기능 요구 사항": "guidelines",
  "6. 결과 예시": "example",
  "7. 제약 사항": "constraints",
  "8. 보너스 과제": "bonus",
};

async function fetchBlocksWithChildren(blockId) {
  const blocks = [];
  let cursor;

  do {
    const response = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if ('type' in block) {
        const blockWithChildren = { ...block };

        if (block.has_children) {
          blockWithChildren.children = await fetchBlocksWithChildren(block.id);
        }

        blocks.push(blockWithChildren);
      }
    }

    cursor = response.next_cursor;
  } while (cursor);

  return blocks;
}

function getBlockPlainText(block) {
  const blockType = block.type;
  const richText = block[blockType]?.rich_text;
  if (richText) {
    return richText.map(t => t.plain_text).join('');
  }
  return '';
}

function findSectionKey(text) {
  const trimmedText = text.trim();

  if (SECTION_MAPPING[trimmedText]) {
    return SECTION_MAPPING[trimmedText];
  }

  for (const [pattern, key] of Object.entries(SECTION_MAPPING)) {
    const normalizedPattern = pattern.replace(/\s+/g, '').toLowerCase();
    const normalizedText = trimmedText.replace(/\s+/g, '').toLowerCase();

    if (normalizedText.startsWith(normalizedPattern.split('.')[0] + '.')) {
      return key;
    }
  }

  return null;
}

function parseBlocksToSections(blocks) {
  const sections = {
    introduction: [],
    objective: [],
    result: [],
    timeGoal: [],
    guidelines: [],
    example: [],
    constraints: [],
    bonus: [],
  };

  let currentSection = null;

  for (const block of blocks) {
    // 최상위 Heading 3 블록
    if (block.type === 'heading_3') {
      const text = getBlockPlainText(block);
      const sectionKey = findSectionKey(text);

      if (sectionKey) {
        currentSection = sectionKey;

        // 토글 헤딩인 경우
        if (block.children && block.children.length > 0) {
          sections[currentSection].push(...block.children);
        }
        continue;
      }
    }

    // Callout 블록 내부의 Heading 3
    if (block.type === 'callout' && block.children) {
      for (const child of block.children) {
        if (child.type === 'heading_3') {
          const text = getBlockPlainText(child);
          const sectionKey = findSectionKey(text);

          if (sectionKey) {
            currentSection = sectionKey;

            // 토글 헤딩인 경우
            if (child.children && child.children.length > 0) {
              sections[currentSection].push(...child.children);
            } else {
              // 일반 헤딩인 경우
              const remainingChildren = block.children.filter(c => c.id !== child.id);
              if (remainingChildren.length > 0) {
                sections[currentSection].push(...remainingChildren);
              }
            }
            break;
          }
        }
      }
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(block);
    }
  }

  return sections;
}

function countBlockTypes(blocks, counts = {}) {
  for (const block of blocks) {
    counts[block.type] = (counts[block.type] || 0) + 1;
    if (block.children) {
      countBlockTypes(block.children, counts);
    }
  }
  return counts;
}

async function test() {
  try {
    console.log('섹션 파싱 테스트...\n');

    const blocks = await fetchBlocksWithChildren(pageId);
    const sections = parseBlocksToSections(blocks);

    console.log('📊 섹션별 블록 수 및 이미지:');
    console.log('─'.repeat(60));

    for (const [key, sectionBlocks] of Object.entries(sections)) {
      const counts = countBlockTypes(sectionBlocks);
      const imageCount = counts.image || 0;
      const totalCount = sectionBlocks.length;

      const sectionName = Object.entries(SECTION_MAPPING).find(([_, v]) => v === key)?.[0] || key;

      console.log(`\n${sectionName}`);
      console.log(`  총 블록: ${totalCount}, 이미지: ${imageCount}개`);

      if (Object.keys(counts).length > 0) {
        const typeStr = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => `${type}:${count}`)
          .join(', ');
        console.log(`  타입: ${typeStr}`);
      }

      // 이미지 위치 출력
      if (imageCount > 0) {
        console.log(`  이미지 위치:`);
        sectionBlocks.forEach((block, idx) => {
          if (block.type === 'image') {
            const prevBlock = sectionBlocks[idx - 1];
            const prevText = prevBlock ? getBlockPlainText(prevBlock).substring(0, 40) : '(없음)';
            console.log(`    - [${idx}] 이전: "${prevText}..."`);
          }
        });
      }
    }

    console.log('\n\n✅ 섹션 파싱 완료!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

test();
