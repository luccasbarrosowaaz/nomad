import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const SocialLinksSettings = ({ register }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Links Sociais</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="website_url">Website</Label>
          <Input id="website_url" {...register('website_url')} placeholder="https://seu-blog.com"/>
        </div>
        <div>
          <Label htmlFor="instagram_url">Instagram</Label>
          <Input id="instagram_url" {...register('instagram_url')} placeholder="https://instagram.com/seu-usuario"/>
        </div>
        <div>
          <Label htmlFor="youtube_url">YouTube</Label>
          <Input id="youtube_url" {...register('youtube_url')} placeholder="https://youtube.com/seu-canal"/>
        </div>
        <div>
          <Label htmlFor="tiktok_url">TikTok</Label>
          <Input id="tiktok_url" {...register('tiktok_url')} placeholder="https://tiktok.com/@seu-usuario"/>
        </div>
        <div>
          <Label htmlFor="facebook_url">Facebook</Label>
          <Input id="facebook_url" {...register('facebook_url')} placeholder="https://facebook.com/seu-perfil"/>
        </div>
      </div>
    </div>
  );
};

export default SocialLinksSettings;