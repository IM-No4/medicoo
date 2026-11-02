import React, { useCallback, useState } from 'react';
import ImageCropperModal from './ImageCropperModal';

/**
 * Crop a picked photo with the move-and-zoom screen (which can zoom OUT, unlike the system cropper).
 *
 *   const { cropImage, cropperElement } = useImageCropper();
 *   ...render {cropperElement} once in the screen...
 *   const asset = (await ImagePicker.launchImageLibraryAsync({ allowsEditing: false })).assets[0];
 *   const cropped = await cropImage(asset.uri);   // null when the person cancels
 */
export function useImageCropper() {
  const [request, setRequest] = useState<{ uri: string; resolve: (uri: string | null) => void } | null>(null);

  const cropImage = useCallback(
    (uri: string) => new Promise<string | null>((resolve) => setRequest({ uri, resolve })),
    [],
  );

  const finish = (uri: string | null) => {
    request?.resolve(uri);
    setRequest(null);
  };

  const cropperElement = request ? (
    <ImageCropperModal uri={request.uri} onCancel={() => finish(null)} onDone={(uri) => finish(uri)} />
  ) : null;

  return { cropImage, cropperElement };
}
