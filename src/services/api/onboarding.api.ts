import { apiClient } from './client';

export type OnboardingPayload = {
  name: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  age: string;
  height: string;
  weight: string;
  blood: string;
  avatar?: string;
};

export async function submitOnboarding(data: OnboardingPayload) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('gender', data.gender);
  formData.append('dob', data.dob);
  formData.append('age', data.age);
  formData.append('height', data.height);
  formData.append('weight', data.weight);
  formData.append('blood', data.blood);

  if (data.avatar) {
    const filename = data.avatar.split('/').pop();
    const match = /\.(\w+)$/.exec(filename ?? '');
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: data.avatar,
      name: filename || 'avatar.jpg',
      type,
    } as any);
  }

  const res = await apiClient.post('/api/user/onboarding', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}
