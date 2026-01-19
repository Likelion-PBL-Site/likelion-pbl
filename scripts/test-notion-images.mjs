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

async function fetchAllBlocksRecursively(blockId, depth = 0) {
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
        blocks.push({ ...block, depth });

        // 자식 블록이 있으면 재귀적으로 가져오기
        if (block.has_children) {
          const children = await fetchAllBlocksRecursively(block.id, depth + 1);
          blocks.push(...children);
        }
      }
    }

    cursor = response.next_cursor;
  } while (cursor);

  return blocks;
}

async function test() {
  try {
    console.log('페이지에서 모든 블록을 재귀적으로 가져오는 중...\n');

    const allBlocks = await fetchAllBlocksRecursively(pageId);
    console.log(`✅ 총 블록 수 (재귀 포함): ${allBlocks.length}\n`);

    // 블록 타입별 카운트
    const typeCounts = {};
    for (const block of allBlocks) {
      typeCounts[block.type] = (typeCounts[block.type] || 0) + 1;
    }
    console.log('📊 블록 타입 분포:');
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count}`);
    }

    // 이미지 블록 찾기
    console.log('\n🖼️ 이미지 블록:');
    const imageBlocks = allBlocks.filter(b => b.type === 'image');

    if (imageBlocks.length === 0) {
      console.log('   이미지 블록을 찾을 수 없습니다.');
    } else {
      for (const img of imageBlocks) {
        console.log(`\n   [depth=${img.depth}] ID: ${img.id}`);
        console.log(`   Type: ${img.image.type}`);

        if (img.image.type === 'file') {
          console.log(`   URL: ${img.image.file?.url?.substring(0, 100)}...`);
          console.log(`   Expiry: ${img.image.file?.expiry_time}`);
        } else if (img.image.type === 'external') {
          console.log(`   URL: ${img.image.external?.url?.substring(0, 100)}...`);
        }

        // 캡션 확인
        if (img.image.caption?.length > 0) {
          const caption = img.image.caption.map(t => t.plain_text).join('');
          console.log(`   Caption: ${caption}`);
        }
      }
    }

    // embed 블록 확인 (이미지가 embed로 삽입될 수 있음)
    console.log('\n🔗 Embed 블록:');
    const embedBlocks = allBlocks.filter(b => b.type === 'embed');
    if (embedBlocks.length === 0) {
      console.log('   Embed 블록 없음');
    } else {
      for (const embed of embedBlocks) {
        console.log(`   URL: ${embed.embed?.url}`);
      }
    }

    // bookmark 블록 확인
    console.log('\n🔖 Bookmark 블록:');
    const bookmarkBlocks = allBlocks.filter(b => b.type === 'bookmark');
    if (bookmarkBlocks.length === 0) {
      console.log('   Bookmark 블록 없음');
    } else {
      for (const bm of bookmarkBlocks) {
        console.log(`   URL: ${bm.bookmark?.url}`);
      }
    }

    // file 블록 확인
    console.log('\n📁 File 블록:');
    const fileBlocks = allBlocks.filter(b => b.type === 'file');
    if (fileBlocks.length === 0) {
      console.log('   File 블록 없음');
    } else {
      for (const f of fileBlocks) {
        console.log(`   Type: ${f.file?.type}`);
        console.log(`   URL: ${f.file?.file?.url || f.file?.external?.url}`);
      }
    }

    console.log('\n✅ 분석 완료');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

test();
