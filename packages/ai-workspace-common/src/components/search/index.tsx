import React, { useState } from 'react';
import { Command } from 'cmdk';
import { useSearchStore } from '@refly-packages/ai-workspace-common/stores/search';
import * as Popover from '@radix-ui/react-popover';
import { Logo, LinearIcon, FigmaIcon, SlackIcon, YouTubeIcon, RaycastIcon } from './icons';
import {} from '@heroicons/react/24/outline';
import {
  IconSearch,
  IconMessage,
  IconFile,
  IconApps,
  IconBook,
  IconEdit,
  IconRobot,
} from '@arco-design/web-react/icon';
import { useDebouncedCallback } from 'use-debounce';
import { defaultFilter } from './cmdk/filter';

import './index.scss';
import { Modal } from '@arco-design/web-react';
import { Home } from './home';
import { DataList } from './data-list';

// request
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { SearchDomain, SearchRequest, SearchResult } from '@refly/openapi-schema';
import { useNavigate } from 'react-router-dom';

export const Search = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [value, setValue] = React.useState('');
  const searchStore = useSearchStore();
  const [displayMode, setDisplayMode] = useState<'search' | 'list'>('list');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef(null);
  const [isComposing, setIsComposing] = useState(false);

  const pages = searchStore.pages;
  const setPages = searchStore.setPages;
  const activePage = pages[pages.length - 1];
  const isHome = activePage === 'home';

  const popPage = React.useCallback(() => {
    const { pages } = useSearchStore.getState();
    const x = [...pages];
    x.splice(-1, 1);
    setPages(x);
  }, []);

  const onKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (isHome || searchValue.length) {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        popPage();
      }
    },
    [searchValue.length, isHome, popPage],
  );

  function bounce() {
    if (ref.current) {
      ref.current.style.transform = 'scale(0.96)';
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.transform = '';
        }

        // setSearchValue('');
      }, 100);
    }
  }

  const getMappedPageToDomain = (activePage: string) => {
    switch (activePage) {
      case 'home':
        return '';
      case 'notes':
        return 'resource';
      case 'readSesources':
        return 'resource';
      case 'knowledgeBases':
        return 'collection';
      case 'convs':
        return 'conversation';
      case 'skills':
        return 'skill';
      default:
        return '';
    }
  };

  const handleBigSearchValueChange = (searchVal: string, activePage: string) => {
    const domain = getMappedPageToDomain(activePage);

    // searchVal 为空的时候获取正常列表的内容
    if (!searchVal) {
      setDisplayMode('list');
      debouncedSearch({
        searchVal: '',
        domains: domain ? [domain] : undefined,
      });
    } else {
      // searchVal 不为空的时候获取搜索的内容
      setDisplayMode('search');
      debouncedSearch({
        searchVal,
        domains: domain ? [domain] : undefined,
      });
    }
  };

  const debouncedSearch = useDebouncedCallback(
    async ({ searchVal, domains }: { searchVal: string; domains?: Array<SearchDomain> }) => {
      try {
        const res = await getClient().search({
          body: {
            query: searchVal,
            scope: 'user',
            domains: domains,
          },
        });

        const resData = res?.data?.data || [];

        // notes
        const notes =
          resData.filter((item) => item?.metadata?.resourceType === 'note' && item?.domain === 'resource') || [];
        const readResources =
          resData.filter((item) => item?.metadata?.resourceType !== 'note' && item?.domain === 'resource') || [];
        const knowledgeBases = resData.filter((item) => item?.domain === 'collection') || [];
        const convs = resData.filter((item) => item?.domain === 'conversation') || [];
        const skills = resData.filter((item) => item?.domain === 'skill') || [];

        searchStore.setSearchedRes({
          notes,
          readResources,
          knowledgeBases,
          convs,
          skills,
        });
      } catch (err) {
        console.log('big search err: ', err);
      }
    },
    200,
  );

  React.useEffect(() => {
    inputRef?.current?.focus();

    handleBigSearchValueChange('', activePage);
  }, [activePage]);

  const renderData = [
    {
      domain: 'skill',
      heading: '技能',
      action: false, // 是否开启 action
      data: searchStore.searchedSkills || [],
      icon: <IconRobot style={{ fontSize: 12 }} />,
    },
    {
      domain: 'note',
      heading: '笔记',
      action: true,
      actionHeading: {
        create: '创建新笔记',
      },
      data: searchStore.searchedNotes || [],
      icon: <IconEdit style={{ fontSize: 12 }} />,
    },
    {
      domain: 'readResources',
      heading: '阅读资源',
      action: true,
      actionHeading: {
        create: '添加阅读资源',
      },
      data: searchStore.searchedReadResources || [],
      icon: <IconBook style={{ fontSize: 12 }} />,
    },
    {
      domain: 'knowledgeBases',
      heading: '知识库',
      action: true,
      actionHeading: {
        create: '创建新知识库',
      },
      data: searchStore.searchedKnowledgeBases || [],
      icon: <IconFile style={{ fontSize: 12 }} />,
    },
    {
      domain: 'convs',
      heading: '会话',
      action: true,
      actionHeading: {
        create: '创建新会话',
      },
      data: searchStore.searchedConvs || [],
      icon: <IconMessage style={{ fontSize: 12 }} />,
    },
  ];
  const getRenderData = (domain: string) => {
    return renderData?.find((item) => item.domain === domain);
  };

  return (
    <div className="vercel">
      <Command
        value={value}
        onValueChange={setValue}
        ref={ref}
        filter={(value, search, keywords) => {
          if (value?.startsWith('refly-built-in')) {
            return 1;
          }

          return defaultFilter(value, search, keywords);
        }}
        onCompositionStart={(e) => console.log('composition start')}
        onCompositionUpdate={(e) => console.log('composition update')}
        onCompositionEnd={(e) => console.log('composition end')}
        onKeyDownCapture={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' && !isComposing) {
            console.log('keydown', searchValue);
            bounce();
          }

          if (isHome || searchValue.length) {
            return;
          }

          if (e.key === 'Backspace') {
            e.preventDefault();
            popPage();
            bounce();
          }
        }}
      >
        <div>
          {pages.map((p) => (
            <div key={p} cmdk-vercel-badge="">
              {p}
            </div>
          ))}
        </div>
        <Command.Input
          autoFocus
          ref={inputRef}
          value={searchValue}
          placeholder="Search for skills, notes, resources and more..."
          onCompositionStart={(e) => {
            setIsComposing(true);
          }}
          onCompositionUpdate={(e) => console.log('composition update')}
          onCompositionEnd={(e) => {
            setIsComposing(false);
          }}
          onValueChange={(val) => {
            console.log('value change', val);
            setSearchValue(val);
            handleBigSearchValueChange(val, activePage);
          }}
        />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          {activePage === 'home' && (
            <Home
              key={'search'}
              displayMode={displayMode}
              pages={pages}
              setPages={(pages: string[]) => setPages(pages)}
              data={renderData}
              activeValue={value}
              searchValue={searchValue}
            />
          )}
          {activePage !== 'home' ? (
            <DataList
              key="data-list"
              displayMode={displayMode}
              {...getRenderData(activePage)}
              activeValue={value}
              searchValue={searchValue}
            />
          ) : null}
        </Command.List>
      </Command>
    </div>
  );
};
