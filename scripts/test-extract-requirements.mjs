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

const pageId = '2edffd33-6b70-80d8-9c6a-c761b6f718f2'; // SpringBoot 1주차
const client = new Client({ auth: process.env.NOTION_API_KEY });

// 섹션 매핑
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
  const richText = block[block.type]?.rich_text;
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
    const num = pattern.split('.')[0];
    if (trimmedText.startsWith(num + '.')) {
      return key;
    }
  }
  return null;
}

function parseBlocksToSections(blocks) {
  const sections = {
    introduction: [], objective: [], result: [], timeGoal: [],
    guidelines: [], example: [], constraints: [], bonus: [],
  };
  let currentSection = null;

  for (const block of blocks) {
    if (block.type === 'heading_3') {
      const text = getBlockPlainText(block);
      const sectionKey = findSectionKey(text);
      if (sectionKey) {
        currentSection = sectionKey;
        if (block.children && block.children.length > 0) {
          sections[currentSection].push(...block.children);
        }
        continue;
      }
    }

    if (block.type === 'callout' && block.children) {
      for (const child of block.children) {
        if (child.type === 'heading_3') {
          const text = getBlockPlainText(child);
          const sectionKey = findSectionKey(text);
          if (sectionKey) {
            currentSection = sectionKey;
            if (child.children && child.children.length > 0) {
              sections[currentSection].push(...child.children);
            } else {
              const remaining = block.children.filter(c => c.id !== child.id);
              sections[currentSection].push(...remaining);
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

// 요구사항 추출 함수 (lib/notion-blocks.ts와 동일)
function extractRequirements(blocks) {
  const requirements = [];
  let currentCategory;
  let reqIndex = 0;

  function processBlocks(blockList) {
    for (const block of blockList) {
      if (block.type === 'heading_3') {
        currentCategory = block.heading_3.rich_text.map(t => t.plain_text).join('');
      }

      if (block.type === 'bulleted_list_item') {
        const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
        if (text.trim()) {
          const isOptional = /\[선택\]|\(선택\)|선택\s*:/i.test(text);
          const cleanTitle = text.replace(/\[선택\]|\(선택\)|선택\s*:/gi, '').trim();

          requirements.push({
            id: `req-${reqIndex++}`,
            title: cleanTitle,
            isRequired: !isOptional,
            category: currentCategory,
          });

          if (block.children) {
            processBlocks(block.children);
          }
        }
      }

      if (block.type === 'numbered_list_item') {
        const text = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
        if (text.trim()) {
          const isOptional = /\[선택\]|\(선택\)|선택\s*:/i.test(text);
          const cleanTitle = text.replace(/\[선택\]|\(선택\)|선택\s*:/gi, '').trim();

          requirements.push({
            id: `req-${reqIndex++}`,
            title: cleanTitle,
            isRequired: !isOptional,
            category: currentCategory,
          });

          if (block.children) {
            processBlocks(block.children);
          }
        }
      }
    }
  }

  processBlocks(blocks);
  return requirements;
}

async function test() {
  try {
    console.log('노션에서 블록 가져오는 중...\n');

    const blocks = await fetchBlocksWithChildren(pageId);
    const sections = parseBlocksToSections(blocks);

    console.log('📋 guidelines 섹션에서 요구사항 추출:\n');

    const requirements = extractRequirements(sections.guidelines);

    console.log(`총 ${requirements.length}개 요구사항 발견\n`);
    console.log('─'.repeat(60));

    let lastCategory = null;
    for (const req of requirements) {
      if (req.category !== lastCategory) {
        console.log(`\n📁 ${req.category || '(카테고리 없음)'}`);
        lastCategory = req.category;
      }
      const marker = req.isRequired ? '✅' : '⭕';
      const tag = req.isRequired ? '[필수]' : '[선택]';
      console.log(`  ${marker} ${tag} ${req.title}`);
    }

    console.log('\n─'.repeat(60));
    console.log(`\n필수: ${requirements.filter(r => r.isRequired).length}개`);
    console.log(`선택: ${requirements.filter(r => !r.isRequired).length}개`);

    console.log('\n✅ 추출 완료!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

test();
