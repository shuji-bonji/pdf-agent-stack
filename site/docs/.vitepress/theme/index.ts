import type { Theme } from 'vitepress';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { onMounted, watch } from 'vue';
import './custom.css';

/**
 * Mermaid 図をクリックで全画面表示し、svg-pan-zoom で拡大・移動できるようにする。
 * 図の中身が細かい（4 層モデル・署名の判断フロー等）ため、本文の幅では読めない。
 *
 * svg-pan-zoom は DOM を触るので動的 import（SSR では読み込まれない）。
 */
export default {
  extends: DefaultTheme,
  setup() {
    const { isDark } = useData();

    onMounted(() => {
      import('svg-pan-zoom').then((module) => {
        const svgPanZoom = module.default;
        let panZoom: SvgPanZoom.Instance | null = null;
        /** 元の図の SVG。テーマ切り替え時に再レンダリングされるので参照を持ち直す */
        let sourceSvg: SVGElement | null = null;

        const dialog = document.createElement('dialog');
        dialog.className = 'mermaid-fullscreen-dialog';
        dialog.innerHTML = `
          <div class="dialog-content">
            <button class="dialog-close" aria-label="Close">×</button>
            <div class="dialog-svg-container"></div>
          </div>
        `;
        document.body.appendChild(dialog);

        const destroyPanZoom = () => {
          if (panZoom) {
            panZoom.destroy();
            panZoom = null;
          }
        };

        const closeDialog = () => {
          destroyPanZoom();
          sourceSvg = null;
          dialog.close();
        };

        dialog.querySelector('.dialog-close')?.addEventListener('click', closeDialog);
        // バックドロップ（コンテンツ外）のクリックで閉じる
        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) closeDialog();
        });
        // ESC で閉じたときも後片付けする
        dialog.addEventListener('close', () => {
          destroyPanZoom();
          sourceSvg = null;
        });

        /** ダイアログへ SVG を複製して pan/zoom を適用する */
        const showSvg = (svg: SVGElement) => {
          const container = dialog.querySelector('.dialog-svg-container');
          if (!container) return;

          container.innerHTML = svg.outerHTML;
          const clone = container.querySelector('svg') as SVGElement | null;
          if (!clone) return;

          // Mermaid の再レンダリングと ID が衝突すると、複製側のスタイルが
          // 元の図に適用されてしまう。複製の ID とその参照を退避する。
          const originalId = clone.id;
          if (originalId) {
            const newId = `${originalId}-dialog`;
            clone.id = newId;
            const style = clone.querySelector('style');
            if (style?.textContent) {
              style.textContent = style.textContent.replaceAll(`#${originalId}`, `#${newId}`);
            }
          }

          destroyPanZoom();
          try {
            panZoom = svgPanZoom(clone, {
              zoomEnabled: true,
              controlIconsEnabled: true,
              fit: true,
              center: true,
              minZoom: 0.1,
              maxZoom: 20,
              zoomScaleSensitivity: 0.3
            });
          } catch (error) {
            console.warn('[mermaid-zoom] svg-pan-zoom の初期化に失敗:', error);
          }
        };

        const initContainers = () => {
          for (const container of document.querySelectorAll('.mermaid')) {
            if ((container as HTMLElement).dataset.zoomReady) continue;
            (container as HTMLElement).dataset.zoomReady = 'true';

            container.addEventListener('click', () => {
              const svg = container.querySelector('svg');
              if (!svg) return;
              sourceSvg = svg as SVGElement;
              dialog.showModal();
              showSvg(sourceSvg);
            });
          }
        };

        initContainers();

        // テーマ切り替えで Mermaid は SVG を作り直す。開いたままなら差し替える。
        watch(isDark, () => {
          setTimeout(() => {
            if (!dialog.open || !sourceSvg) return;
            const latest = sourceSvg.closest('.mermaid')?.querySelector('svg');
            if (!latest) return;
            sourceSvg = latest as SVGElement;
            showSvg(sourceSvg);
          }, 500);
        });

        // SPA 遷移と Mermaid の遅延描画に追随する
        let timer: ReturnType<typeof setTimeout> | null = null;
        new MutationObserver(() => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(initContainers, 300);
        }).observe(document.body, { childList: true, subtree: true });
      });
    });
  }
} satisfies Theme;
