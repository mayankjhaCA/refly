import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';
import { App } from './App';

import { setRuntime } from '@refly/utils/env';
import { ConfigProvider } from 'antd';
import { MemoryRouter, Route } from '@refly-packages/ai-workspace-common/utils/router';
import { AppRouter } from '@/routes';
import { Login } from '@/pages/login/index.tsx';

export default defineContentScript({
  matches: ['<all_urls>'],
  // 2. Set cssInjectionMode
  cssInjectionMode: 'ui',
  excludeMatches: [
    'https://refly.ai/*',
    'https://api.refly.ai/*',
    'https://www.refly.ai/*',
    'http://localhost:5173/*',
  ],

  async main(ctx) {
    setRuntime('extension-csui');

    console.log('ctx', ctx);
    let removeInjectCSS: () => void;
    // 3. Define your UI`
    const ui = await createShadowRootUi(ctx, {
      name: 'refly-float-sphere',
      position: 'inline',
      append: 'last',
      onMount(container) {
        // 渲染 selector
        const root = ReactDOM.createRoot(container);
        root.render(
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#00968F',
                borderRadius: 6,
                controlItemBgActive: '#f1f1f0',
                controlItemBgActiveHover: '#e0e0e0',
              },
            }}
          >
            <MemoryRouter>
              <AppRouter loadingElement={<div />} loginElement={<div />}>
                <Route path="/" element={<App />} />
                <Route path="/login" element={<div />} />
              </AppRouter>
            </MemoryRouter>
          </ConfigProvider>,
        );

        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    // 4. Mount the UI
    ui.mount();
  },
});
