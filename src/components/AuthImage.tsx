import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ImageSourcePropType, View } from 'react-native';

import { API_BASE_URL } from '../config/env';
import { getToken } from '../utils/tokenManagement';

// The backend (server.js `requireAuthenticatedFileAccess`) only serves private
// upload folders - profile-pictures, documents, prescriptions, ... - to
// requests carrying `Authorization: Bearer <token>`. A plain
// <Image source={{ uri }}> sends no headers, so the server answers 403 and the
// picture never shows. This wraps Image so those requests are authenticated.

const isOwnServerUrl = (uri: string) => uri.startsWith(API_BASE_URL);

// Turns whatever the API stored into something Image can load, and says
// whether the request needs the auth header.
//  - data:/file:/content:/blob: -> used as is, no auth
//  - http(s)://...              -> used as is; auth only when it's OUR server
//  - uploads/... (a stored path) -> prefixed with the API base URL, with auth
//  - anything else              -> legacy raw base64 -> data: URI
export function resolveImageUri(raw?: string | null): { uri: string; needsAuth: boolean } | null {
  if (!raw) return null;
  if (/^(data|file|content|blob):/i.test(raw)) return { uri: raw, needsAuth: false };
  if (/^https?:\/\//i.test(raw)) return { uri: raw, needsAuth: isOwnServerUrl(raw) };
  if (/^\/?(uploads|storePartnerDocuments)\//i.test(raw) || /\.(jpe?g|png|webp|gif|heic)$/i.test(raw)) {
    return { uri: `${API_BASE_URL}/${raw.replace(/^\//, '')}`, needsAuth: true };
  }
  return { uri: `data:image/jpeg;base64,${raw}`, needsAuth: false };
}

// null while the token is still being read (never load an authenticated image
// without it - the failed request would just be cached as a 403).
export function useImageSource(raw?: string | null): ImageSourcePropType | null {
  const resolved = resolveImageUri(raw);
  const needsAuth = !!resolved?.needsAuth;
  const [token, setToken] = useState<string | null | undefined>(needsAuth ? undefined : null);

  useEffect(() => {
    if (!needsAuth) return;
    let alive = true;
    getToken('access_token')
      .then((t) => alive && setToken(t))
      .catch(() => alive && setToken(null));
    return () => {
      alive = false;
    };
  }, [needsAuth]);

  if (!resolved) return null;
  if (!needsAuth) return { uri: resolved.uri };
  if (token === undefined) return null;
  return token ? { uri: resolved.uri, headers: { Authorization: `Bearer ${token}` } } : { uri: resolved.uri };
}

interface AuthImageProps extends Omit<ImageProps, 'source'> {
  // The raw value from the API (stored path, full URL, data URI or base64).
  uri?: string | null;
  // Rendered when there's no image or it fails to load.
  fallback?: React.ReactNode;
}

export function AuthImage({ uri, fallback = null, style, onError, ...rest }: AuthImageProps) {
  const source = useImageSource(uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) return <>{fallback}</>;
  // Token still loading: hold the space so layout doesn't jump.
  if (!source) return <View style={style as any} />;

  return (
    <Image
      {...rest}
      source={source}
      style={style}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}

export default AuthImage;
