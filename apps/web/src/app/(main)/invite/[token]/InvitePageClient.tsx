'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AUTH_MESSAGE_LOGIN_FAILED } from '@metaboost/helpers';
import {
  Button,
  CenterInViewport,
  LoginForm,
  RateLimitModal,
  Row,
  Stack,
  Text,
} from '@metaboost/ui';

import { useAuth } from '../../../../context/AuthContext';
import { getApiBaseUrl } from '../../../../lib/api-client';
import { bucketDetailRoute, ROUTES } from '../../../../lib/routes';

type Invitation = {
  token: string;
  bucketId: string;
  bucketIdText?: string;
  bucketName?: string;
  bucketCrud: number;
  bucketMessagesCrud: number;
  status: string;
};

export function InvitePageClient() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';
  const { user, login } = useAuth();
  const t = useTranslations('invite');
  const tErrors = useTranslations('errors');

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [acceptRejectLoading, setAcceptRejectLoading] = useState<'accept' | 'reject' | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitRetrySeconds, setRateLimitRetrySeconds] = useState<number | undefined>(undefined);

  const fetchInvitation = useCallback(async () => {
    if (token === '') {
      setInvitationError('Invalid link');
      setLoadingInvitation(false);
      return;
    }
    setLoadingInvitation(true);
    setInvitationError(null);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/admin-invitations/${token}`, { credentials: 'include' });
      if (res.status === 404 || res.status === 410) {
        const data = await res.json().catch(() => ({}));
        setInvitationError(
          typeof data?.message === 'string'
            ? data.message
            : 'Invitation not found or no longer valid'
        );
        setInvitation(null);
        setLoadingInvitation(false);
        return;
      }
      if (!res.ok) {
        setInvitationError('Failed to load invitation');
        setLoadingInvitation(false);
        return;
      }
      const data = (await res.json()) as { invitation?: Invitation };
      if (data.invitation !== undefined) {
        setInvitation(data.invitation);
      } else {
        setInvitationError('Invalid response');
      }
    } catch {
      setInvitationError('Network error');
    } finally {
      setLoadingInvitation(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  const handleLoginSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (result.ok) {
      setShowLoginForm(false);
    } else if (result.rateLimit !== undefined) {
      setRateLimitRetrySeconds(result.rateLimit.retryAfterSeconds);
      setShowRateLimitModal(true);
    } else {
      setLoginError(
        result.message === AUTH_MESSAGE_LOGIN_FAILED ? tErrors('loginFailed') : result.message
      );
    }
  };

  const handleAccept = async () => {
    if (invitation === null || user === null) return;
    setAcceptRejectLoading('accept');
    setResultMessage(null);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/admin-invitations/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        alreadyOwner?: boolean;
        alreadyAdmin?: boolean;
        bucketIdText?: string;
      };
      if (res.ok) {
        const idText =
          typeof data.bucketIdText === 'string' ? data.bucketIdText : invitation.bucketIdText;
        if (data.alreadyOwner === true) {
          setResultMessage(t('youAreOwner'));
        } else if (data.alreadyAdmin === true) {
          setResultMessage(t('alreadyAdmin'));
        } else {
          setResultMessage(t('accepted'));
        }
        if (typeof idText === 'string') {
          setTimeout(
            () => router.push(bucketDetailRoute(idText)),
            data.alreadyOwner === true ? 800 : 1500
          );
        } else {
          setTimeout(() => router.push(ROUTES.DASHBOARD), 1500);
        }
      } else {
        setResultMessage(typeof data?.message === 'string' ? data.message : t('acceptFailed'));
      }
    } catch {
      setResultMessage('Network error');
    } finally {
      setAcceptRejectLoading(null);
    }
  };

  const handleReject = async () => {
    if (invitation === null || user === null) return;
    setAcceptRejectLoading('reject');
    setResultMessage(null);
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/admin-invitations/${token}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setResultMessage(t('rejected'));
        setInvitation(null);
        setInvitationError(t('linkInvalidAfterReject'));
      } else {
        const data = await res.json().catch(() => ({}));
        setResultMessage(typeof data?.message === 'string' ? data.message : t('rejectFailed'));
      }
    } catch {
      setResultMessage('Network error');
    } finally {
      setAcceptRejectLoading(null);
    }
  };

  if (loadingInvitation) {
    return (
      <CenterInViewport contentMaxWidth="readable" contentTextAlign="center">
        <Stack>
          <Text>{t('loading')}</Text>
        </Stack>
      </CenterInViewport>
    );
  }

  if (invitationError !== null && invitation === null) {
    return (
      <CenterInViewport contentMaxWidth="readable" contentTextAlign="center">
        <Stack>
          <Text variant="error" as="p">
            {invitationError}
          </Text>
          <Button variant="secondary" onClick={() => router.push(ROUTES.HOME)}>
            {t('goHome')}
          </Button>
        </Stack>
      </CenterInViewport>
    );
  }

  if (invitation === null) {
    return null;
  }

  return (
    <>
      <RateLimitModal
        open={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        retryAfterSeconds={rateLimitRetrySeconds}
      />
      <CenterInViewport contentMaxWidth="readable" contentTextAlign="center">
        <Stack alignItems="center">
          <h2>{t('title')}</h2>
          <Text as="p">
            {t('invitedTo')} <strong>{invitation.bucketName ?? invitation.bucketId}</strong>
          </Text>
          {user === null ? (
            <>
              <Text as="p" variant="muted">
                {t('loginRequired')}
              </Text>
              {!showLoginForm ? (
                <Button variant="primary" onClick={() => setShowLoginForm(true)}>
                  {t('loginButton')}
                </Button>
              ) : (
                <LoginForm
                  email={loginEmail}
                  password={loginPassword}
                  onEmailChange={setLoginEmail}
                  onPasswordChange={setLoginPassword}
                  onSubmit={handleLoginSubmit}
                  loading={loginLoading}
                  submitError={loginError}
                  signupHref={ROUTES.SIGNUP}
                  forgotPasswordHref={ROUTES.FORGOT_PASSWORD}
                />
              )}
            </>
          ) : (
            <>
              {resultMessage !== null && (
                <Text as="p" variant="muted" role="status">
                  {resultMessage}
                </Text>
              )}
              {resultMessage === null && (
                <Row>
                  <Button
                    variant="secondary"
                    onClick={handleReject}
                    loading={acceptRejectLoading === 'reject'}
                  >
                    {t('reject')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAccept}
                    loading={acceptRejectLoading === 'accept'}
                  >
                    {t('accept')}
                  </Button>
                </Row>
              )}
            </>
          )}
        </Stack>
      </CenterInViewport>
    </>
  );
}
