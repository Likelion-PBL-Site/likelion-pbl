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

async function fetchChildBlocks(blockId) {
  const response = await client.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });
  return response.results;
}

async function test() {
  try {
    console.log('Fetching blocks from page:', pageId);

    const response = await client.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    console.log('\n✅ Total top-level blocks:', response.results.length);

    // Toggle 블록 확인 (이미지가 여기 있을 수 있음)
    console.log('\n📦 Toggle blocks with children:');

    for (const block of response.results) {
      if ('type' in block && block.type === 'toggle' && block.has_children) {
        const toggleText = block.toggle.rich_text.map(t => t.plain_text).join('');
        console.log(`\n[Toggle] "${toggleText.substring(0, 50)}..."`);

        // 자식 블록 가져오기
        const children = await fetchChildBlocks(block.id);
        console.log(`  Children: ${children.length} blocks`);

        // 이미지 찾기
        for (const child of children) {
          if ('type' in child && child.type === 'image') {
            const imgType = child.image.type;
            const url = imgType === 'file'
              ? child.image.file?.url
              : child.image.external?.url;
            console.log(`  🖼️ Image (${imgType}):`);
            console.log(`     URL: ${(url || '').substring(0, 100)}...`);
          }
        }

        // 블록 타입 출력
        const types = {};
        for (const child of children) {
          if ('type' in child) {
            types[child.type] = (types[child.type] || 0) + 1;
          }
        }
        console.log('  Types:', Object.entries(types).map(([k,v]) => `${k}:${v}`).join(', '));
      }
    }

    console.log('\n✅ 테스트 완료');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
