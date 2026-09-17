/**
 * Supabase Client & Storage Integration Service for InnoBiz Documentation
 * Designed for Supabase Storage (bucket: innobiz-documents) + GitHub + Vercel deployment.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'innobiz_custom_supabase_url';
const SUPABASE_ANON_KEY = 'innobiz_custom_supabase_anon_key';
export const BUCKET_NAME = 'innobiz-documents';

/**
 * Get active Supabase configuration (prefers custom localStorage config, then env vars)
 */
export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  try {
    const customUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const customKey = localStorage.getItem(SUPABASE_ANON_KEY);
    if (customUrl && customKey) {
      url = customUrl.trim();
      anonKey = customKey.trim();
    }
  } catch (e) {
    console.warn('Unable to read Supabase config from localStorage:', e);
  }

  if (!url || !anonKey) {
    url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
    anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  }

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project') &&
    !anonKey.includes('your-anon-key') &&
    url.startsWith('http')
  );

  return { url, anonKey, isConfigured };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (url && anonKey) {
      localStorage.setItem(SUPABASE_URL_KEY, url.trim());
      localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(SUPABASE_URL_KEY);
      localStorage.removeItem(SUPABASE_ANON_KEY);
    }
    // Invalidate cached client
    cachedClient = null;
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  filePath: string,
  file: File | Blob,
  contentType?: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase가 아직 설정되지 않았습니다. 로컬 브라우저에 안전하게 보관됩니다.',
    };
  }

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: true,
        contentType: contentType || (file instanceof File ? file.type : 'application/octet-stream'),
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: urlData?.publicUrl || '',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Supabase 업로드 중 네트워크 오류가 발생했습니다.',
    };
  }
}

/**
 * Generate standard InnoBiz Word document (.doc) from Claude markdown/text
 */
export function convertClaudeMarkdownToWordDoc(
  evalItemTitle: string,
  majorCategory: string,
  markdownText: string,
  companyName: string = '주식회사 이노테크',
  ceoName: string = '홍길동'
): Blob {
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Convert basic markdown formatting into HTML
  let parsedContent = markdownText
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 13pt; font-weight: bold; color: #1e3a8a; margin-top: 14pt; margin-bottom: 6pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 3pt;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 15pt; font-weight: bold; color: #0f172a; margin-top: 18pt; margin-bottom: 8pt; border-bottom: 2pt solid #1e3a8a; padding-bottom: 4pt;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 18pt; font-weight: bold; text-align: center; color: #0f172a; margin-top: 20pt; margin-bottom: 16pt;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li style="margin-bottom: 4pt; line-height: 1.6;">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 8pt; line-height: 1.6; text-align: justify;">');

  const htmlDoc = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${evalItemTitle} - 이노비즈 심사 대응서류</title>
      <style>
        body {
          font-family: 'Malgun Gothic', Dotum, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1e293b;
          margin: 20mm 15mm;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15pt;
        }
        .approval-table {
          width: 190pt;
          border-collapse: collapse;
          text-align: center;
          font-size: 9pt;
          margin-left: auto;
        }
        .approval-table th, .approval-table td {
          border: 1pt solid #475569;
          padding: 4pt;
        }
        .doc-title {
          font-size: 20pt;
          font-weight: 800;
          text-align: center;
          margin: 15pt 0 10pt 0;
          letter-spacing: -0.5pt;
          color: #0f172a;
        }
        .meta-box {
          background-color: #f8fafc;
          border: 1pt solid #cbd5e1;
          padding: 8pt 12pt;
          margin-bottom: 16pt;
          font-size: 9.5pt;
        }
        p {
          margin-bottom: 8pt;
          text-align: justify;
        }
        ul {
          margin-top: 4pt;
          margin-bottom: 10pt;
          padding-left: 20pt;
        }
        .footer {
          margin-top: 30pt;
          padding-top: 10pt;
          border-top: 1pt solid #cbd5e1;
          text-align: center;
          font-size: 9pt;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <div style="font-size: 14pt; font-weight: bold; color: #1e3a8a;">${companyName}</div>
            <div style="font-size: 9pt; color: #64748b; margin-top: 2pt;">이노비즈(InnoBiz) 기술혁신형 중소기업 인증 대응서류</div>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <table class="approval-table" align="right">
              <tr>
                <th rowspan="2" style="width: 24pt; background-color: #f1f5f9;">결<br>재</th>
                <th style="width: 50pt; background-color: #f1f5f9;">기안자</th>
                <th style="width: 50pt; background-color: #f1f5f9;">검토자</th>
                <th style="width: 50pt; background-color: #f1f5f9;">승인권자</th>
              </tr>
              <tr style="height: 35pt;">
                <td>담당</td>
                <td>부서장</td>
                <td>대표이사<br>${ceoName}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div class="doc-title">${evalItemTitle}</div>

      <div class="meta-box">
        <table style="width: 100%; border: none; font-size: 9.5pt;">
          <tr>
            <td style="width: 50%;"><strong>심사 대항목:</strong> ${majorCategory}</td>
            <td style="width: 50%;"><strong>문서 기안일자:</strong> ${dateStr}</td>
          </tr>
          <tr>
            <td><strong>작성 주체:</strong> Claude AI & 기술보증기금 평가대응팀</td>
            <td><strong>보관 등급:</strong> 사내 대외비 (현장실사 제출용)</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 10pt;">
        <p>${parsedContent}</p>
      </div>

      <div class="footer">
        본 문서는 기술혁신촉진법 및 중소벤처기업부 이노비즈 기술혁신시스템 평가기준에 의거하여 작성되었습니다. | ${companyName}
      </div>
    </body>
    </html>
  `;

  return new Blob(['\uFEFF' + htmlDoc], {
    type: 'application/msword;charset=utf-8',
  });
}
