import { neon } from '@neondatabase/serverless';
import { NeonQueryFunction } from '@neondatabase/serverless';

// 빌드 시 즉시 초기화하지 않고, 실제 쿼리 시에만 연결
let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url || url.startsWith('여기에')) {
      throw new Error('DATABASE_URL 환경변수를 설정해주세요.');
    }
    _sql = neon(url);
  }
  return _sql;
}

// Tagged template literal proxy
const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args) {
    const fn = getSql();
    return (fn as any)(...args);
  },
  get(_target, prop) {
    const fn = getSql();
    return (fn as any)[prop];
  },
});

export { sql };
export default sql;
