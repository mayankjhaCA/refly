import { useState } from 'react';

import { Button, Tooltip } from 'antd';

// styles
import './index.scss';
import { useTranslation } from 'react-i18next';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { IconCheck, IconQuestionCircle } from '@arco-design/web-react/icon';
import { useSubscriptionStoreShallow } from '@refly-packages/ai-workspace-common/stores/subscription';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useNavigate } from '@refly-packages/ai-workspace-common/utils/router';
import { useAuthStoreShallow } from '@refly-packages/ai-workspace-common/stores/auth';

export type PriceLookupKey = 'monthly' | 'yearly';
export type PriceSource = 'page' | 'modal';
const premiumModels = 'GPT-4o / Claude 3.5 Sonnet / Gemini Pro 1.5';
const basicModels = 'GPT-4o Mini / Claude 3 Haiku / Gemini Flash 1.5';

interface ModelFeatures {
  name: string;
  details?: string;
  tooltip?: string;
}

const PlanItem = (props: {
  title: 'max' | 'pro' | 'plus' | 'free';
  isActive: boolean;
  features: ModelFeatures[];
  handleClick?: () => void;
  lookupKey: string;
  loadingInfo: {
    isLoading: boolean;
    plan: string;
  };
}) => {
  const { t } = useTranslation();
  const { title, isActive, features, handleClick, lookupKey, loadingInfo } = props;
  const { isLogin } = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
  }));
  const { setLoginModalOpen } = useAuthStoreShallow((state) => ({
    setLoginModalOpen: state.setLoginModalOpen,
  }));

  const getPrice = (plan: 'max' | 'pro' | 'plus' | 'free') => {
    switch (plan) {
      case 'max':
        return lookupKey === 'monthly' ? 29.9 : 149.5;
      case 'pro':
        return lookupKey === 'monthly' ? 9.9 : 49.5;
      case 'plus':
        return lookupKey === 'monthly' ? 4.9 : 24.5;
      case 'free':
        return 0;
    }
  };

  const getButtonText = (plan: 'max' | 'pro' | 'plus' | 'free') => {
    if (isLogin) {
      switch (plan) {
        case 'max':
        case 'pro':
        case 'plus':
          return t('settings.subscription.subscribe.upgrade');
        case 'free':
          return t('settings.subscription.subscribe.continueFree');
        default:
          return t('settings.subscription.getStarted');
      }
    } else {
      return t('settings.subscription.getStarted');
    }
  };

  const handleButtonClick = () => {
    console.log('handleButtonClick', isLogin);
    if (isLogin) {
      handleClick();
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <div className={`subscribe-content-plans-item ${isActive ? 'active' : ''}`}>
      <div className="subscribe-content-plans-item-title">{t(`settings.subscription.subscriptionStatus.${title}`)}</div>

      <div className="subscribe-content-plans-item-price">
        <span className="price">
          {title !== 'free' ? (
            <>
              ${getPrice(title)}
              {lookupKey === 'yearly' && (
                <span className="text-sm text-gray-500">
                  (<span className="line-through decoration-gray-700 ">${getPrice(title) * 2}</span>)
                </span>
              )}
            </>
          ) : (
            t('settings.subscription.subscribe.forFree')
          )}
        </span>
        <span className="period">
          {' '}
          /{' '}
          {title === 'free'
            ? t('settings.subscription.subscribe.period')
            : t(`settings.subscription.subscribe.${lookupKey === 'monthly' ? 'month' : 'year'}`)}
        </span>
      </div>

      <div className="description">{t(`settings.subscription.subscribe.${title}.description`)}</div>

      <Button
        className="subscribe-btn"
        type={isActive ? 'primary' : 'default'}
        onClick={handleButtonClick}
        loading={loadingInfo.isLoading && loadingInfo.plan === title}
      >
        {getButtonText(title)}
      </Button>

      <div className="plane-features">
        <div className="description">{t('settings.subscription.subscribe.planFeatures')}</div>
        {features.map((feature, index) => (
          <div className="plane-features-item" key={index}>
            <div className="name">
              <IconCheck style={{ color: 'green', strokeWidth: 6 }} /> {feature.name}
              {feature.tooltip && (
                <Tooltip title={<div>{feature.tooltip}</div>}>
                  <IconQuestionCircle />
                </Tooltip>
              )}
            </div>
            <div className="details">{feature.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PriceContent = (props: { source: PriceSource }) => {
  const navigate = useNavigate();
  const { source } = props;
  const { t } = useTranslation();
  const { setSubscribeModalVisible: setVisible } = useSubscriptionStoreShallow((state) => ({
    setSubscribeModalVisible: state.setSubscribeModalVisible,
  }));
  const { setLoginModalOpen } = useAuthStoreShallow((state) => ({
    setLoginModalOpen: state.setLoginModalOpen,
  }));
  const { isLogin } = useUserStoreShallow((state) => ({
    isLogin: state.isLogin,
  }));

  const [lookupKey, setLookupKey] = useState<PriceLookupKey>('yearly');
  const [loadingInfo, setLoadingInfo] = useState<{
    isLoading: boolean;
    plan: string;
  }>({
    isLoading: false,
    plan: '',
  });

  const modalTooltipContent = t('settings.subscription.subscribe.tooltip.modelToken');
  const vectorStorageTooltipContent = t('settings.subscription.subscribe.tooltip.vectorStorage');
  const fileStorageTooltipContent = t('settings.subscription.subscribe.tooltip.fileStorage');

  const freeFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t2ModalOneTime', { tokenCount: '1,000,000' }),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (10MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.fileStorage')} (100MB)`,
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.free.serviceSupport.name'),
      details: t('settings.subscription.subscribe.free.serviceSupport.details'),
    },
  ];

  const plusFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t1ModalMonthly', { tokenCount: '500,000' }),
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.t2ModalMonthly', { tokenCount: '5,000,000' }),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (50MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.fileStorage')} (500MB)`,
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.plus.serviceSupport.name'),
      details: t('settings.subscription.subscribe.plus.serviceSupport.details'),
    },
  ];

  const proFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t1ModalMonthly', { tokenCount: '1,000,000' }),
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.t2ModalUnlimited'),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (100MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.fileStorage')} (1G)`,
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.pro.serviceSupport.name'),
      details: t('settings.subscription.subscribe.pro.serviceSupport.details'),
    },
  ];

  const maxFeatures: ModelFeatures[] = [
    {
      name: t('settings.subscription.subscribe.t1ModalUnlimited'),
      details: premiumModels,
      tooltip: modalTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.t2ModalUnlimited'),
      details: basicModels,
      tooltip: modalTooltipContent,
    },
    {
      name: `${t('settings.subscription.subscribe.vectorStorage')} (500MB)`,
      tooltip: vectorStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.fileStorage', { storage: '5G' }),
      tooltip: fileStorageTooltipContent,
    },
    {
      name: t('settings.subscription.subscribe.max.serviceSupport.name'),
      details: t('settings.subscription.subscribe.max.serviceSupport.details'),
    },
  ];

  const createCheckoutSession = async (plan: 'max' | 'pro' | 'plus') => {
    if (loadingInfo.isLoading) return;
    setLoadingInfo({
      isLoading: true,
      plan,
    });
    const { data } = await getClient().createCheckoutSession({
      body: {
        planType: plan,
        interval: lookupKey,
      },
    });
    setLoadingInfo({
      isLoading: false,
      plan: '',
    });

    if (data?.data?.url) {
      window.location.href = data.data.url;
    }
  };

  return (
    <div className="subscribe-content min-w-[1000px]">
      <div className="subscribe-content-title">{t('settings.subscription.subscribe.title')}</div>
      <div className="subscribe-content-subtitle">{t('settings.subscription.subscribe.subtitle')}</div>

      <div className="subscribe-content-type">
        <div className="subscribe-content-type-inner">
          <div
            className={`subscribe-content-type-inner-item ${lookupKey === 'yearly' ? 'active' : ''}`}
            onClick={() => setLookupKey('yearly')}
          >
            {t('settings.subscription.subscribe.yearly')}
          </div>

          <div
            className={`subscribe-content-type-inner-item ${lookupKey === 'monthly' ? 'active' : ''}`}
            onClick={() => setLookupKey('monthly')}
          >
            {t('settings.subscription.subscribe.monthly')}
          </div>
        </div>
      </div>

      <div className="subscribe-content-plans">
        <PlanItem
          title="free"
          features={freeFeatures}
          isActive={false}
          handleClick={() => {
            isLogin
              ? source === 'modal'
                ? setVisible(false)
                : navigate('/', { replace: true })
              : setLoginModalOpen(true);
          }}
          lookupKey={lookupKey}
          loadingInfo={loadingInfo}
        />

        <PlanItem
          title="plus"
          features={plusFeatures}
          isActive={true}
          handleClick={() => createCheckoutSession('plus')}
          lookupKey={lookupKey}
          loadingInfo={loadingInfo}
        />

        <PlanItem
          title="pro"
          features={proFeatures}
          isActive={true}
          handleClick={() => createCheckoutSession('pro')}
          lookupKey={lookupKey}
          loadingInfo={loadingInfo}
        />

        <PlanItem
          title="max"
          features={maxFeatures}
          isActive={true}
          handleClick={() => createCheckoutSession('max')}
          lookupKey={lookupKey}
          loadingInfo={loadingInfo}
        />
      </div>

      {isLogin && (
        <div className="subscribe-content-description">
          {t('settings.subscription.subscribe.description')}
          <a href={`/privacy`} target="_blank" rel="noreferrer">
            {t('settings.subscription.subscribe.privacy')}
          </a>
          {t('settings.subscription.subscribe.and')}
          <a href={`/terms`} target="_blank" rel="noreferrer">
            {t('settings.subscription.subscribe.terms')}
          </a>
        </div>
      )}
    </div>
  );
};
