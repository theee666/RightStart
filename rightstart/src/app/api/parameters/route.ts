import { NextResponse } from 'next/server';
import { getParameters, noStore, session } from '@/lib/dify';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (!(await session())?.authorized)
      return NextResponse.json({ error: '请先验证访问权限。' }, { status: 401, headers: noStore });
    const p = await getParameters();
    return NextResponse.json(
      {
        user_input_form: p.user_input_form,
        file_upload: p.file_upload,
        opening_statement: p.opening_statement,
      },
      { headers: noStore },
    );
  } catch {
    return NextResponse.json(
      { error: '无法读取应用参数，请检查 Dify 配置。' },
      { status: 503, headers: noStore },
    );
  }
}
