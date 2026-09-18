import Image from 'next/image';

type Props = {
  /** 세로 크기(px). 원본 비율 286:512 */
  size?: 48 | 64 | 80 | 96 | 128;
  /** 말풍선 한 줄. 없으면 그림만 */
  say?: string;
  className?: string;
};

/** 도우미 맹구. 홈 인사·온보딩·완료·게임 설명처럼 "한 마디"가 필요한 자리에만 쓴다. */
export function Mascot({ size = 64, say, className = '' }: Props) {
  const h = size;
  const w = Math.round((size * 286) / 512);
  const src = size > 96 ? '/mascot/maenggu-512.png' : '/mascot/maenggu-192.png';
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <Image src={src} width={w} height={h} alt="맹구" className="shrink-0 select-none" draggable={false} />
      {say && (
        <div className="relative mb-2 max-w-[70%] rounded-2xl border border-line bg-paper px-4 py-2.5 text-sm leading-snug shadow-sm">
          <span aria-hidden className="absolute -left-1.5 bottom-3 size-3 rotate-45 border-b border-l border-line bg-paper" />
          {say}
        </div>
      )}
    </div>
  );
}
