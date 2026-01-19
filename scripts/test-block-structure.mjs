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

function getBlockText(block) {
  const richTextKey = block[block.type]?.rich_text;
  if (richTextKey) {
    return richTextKey.map(t => t.plain_text).join('').substring(0, 50);
  }
  return '';
}

function printBlockTree(blocks, indent = 0) {
  const prefix = '  '.repeat(indent);

  for (const block of blocks) {
    const text = getBlockText(block);
    const hasImage = block.type === 'image';
    const childCount = block.children?.length || 0;

    let line = `${prefix}├── ${block.type}`;
    if (text) line += `: "${text}..."`;
    if (hasImage) line += ' 🖼️';
    if (childCount > 0) line += ` (${childCount} children)`;

    console.log(line);

    if (block.children) {
      printBlockTree(block.children, indent + 1);
    }
  }
}

async function test() {
  try {
    console.log('블록 계층 구조 분석 중...\n');

    const blocks = await fetchBlocksWithChildren(pageId);

    // "6. 결과 예시" 섹션 찾기 (이미지가 많을 것으로 예상)
    console.log('📦 "6. 결과 예시" 섹션의 계층 구조:\n');

    for (const block of blocks) {
      if (block.type === 'callout' && block.children) {
        // 이 callout에 "6. 결과 예시" 헤딩이 있는지 확인
        const hasExampleSection = block.children.some(
          child => child.type === 'heading_3' &&
          getBlockText(child).includes('결과 예시')
        );

        if (hasExampleSection) {
          console.log('callout (섹션 컨테이너)');
          printBlockTree(block.children, 1);
          break;
        }
      }
    }

    // 이미지 주변 문맥 확인
    console.log('\n\n📷 이미지와 주변 문맥:\n');

    function findImagesWithContext(blocks, context = []) {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const prevBlock = blocks[i - 1];
        const nextBlock = blocks[i + 1];

        if (block.type === 'image') {
          console.log('─'.repeat(50));
          if (prevBlock) {
            console.log(`이전: [${prevBlock.type}] ${getBlockText(prevBlock) || '(no text)'}`);
          }
          console.log(`🖼️  이미지 블록 (ID: ${block.id.substring(0, 8)}...)`);
          if (nextBlock) {
            console.log(`다음: [${nextBlock.type}] ${getBlockText(nextBlock) || '(no text)'}`);
          }
          console.log(`문맥 경로: ${context.join(' > ')}`);
        }

        if (block.children) {
          findImagesWithContext(block.children, [...context, block.type]);
        }
      }
    }

    findImagesWithContext(blocks);

    console.log('\n✅ 분석 완료');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
