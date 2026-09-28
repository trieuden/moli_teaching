'use client';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GlobalHeader() {
  const { t } = useTranslation('common');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) || 'vi';
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isFlashcard = pathname?.includes('/game/flashcard');

  const switchLocale = () => {
    const newLocale = locale === 'vi' ? 'en' : 'vi';
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    document.cookie = `lang=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;
    router.push(newPath);
  };

  const itemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    background: 'transparent',
    borderRadius: '999px',
    padding: '10px 18px',
    color: '#1e3a2f',
    fontWeight: 700,
    fontSize: '14px',
    transition: 'background 0.18s',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
    textDecoration: 'none',
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '20px',
        ...(isFlashcard
          ? { left: '20px', transform: 'none' }
          : { left: '50%', transform: 'translateX(-50%)' }),
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,0.6)',
        borderRadius: '999px',
        padding: '6px 8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 1.5px 4px rgba(0,0,0,0.06)',
        transition: 'left 0.3s ease, transform 0.3s ease, bottom 0.3s ease',
      }}
    >
      {/* Home — ẩn khi đang ở trang chủ */}
      {!isHome && (
        <Link
          href={`/${locale}`}
          style={itemBase}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(16,185,129,0.12)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>
      )}

      {/* Divider */}
      {!isHome && (
        <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.12)', margin: '0 2px', flexShrink: 0 }} />
      )}

      {/* Language toggle: VIE ⇅ ENG */}
      <button
        onClick={switchLocale}
        title={t('language')}
        style={{ ...itemBase, padding: '8px 14px', gap: '6px' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.06)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {/* Label hiện tại — đậm */}
        <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em' }}>
          {locale === 'vi' ? 'VIE' : 'ENG'}
        </span>

        {/* Mũi tên swap */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
          <path d="M7 16V4m0 0L3 8m4-4l4 4" />
          <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>

        {/* Label đích — mờ */}
        <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em', opacity: 0.35 }}>
          {locale === 'vi' ? 'ENG' : 'VIE'}
        </span>
      </button>
    </nav>

  );
}
