-- Make the Free vs Premium experience visible in the live demo catalogue.
-- Admin Studio can change these access levels later without a code deploy.

begin;

update public.media_items
set access_level = 'premium'
where slug in (
  'lake-malawi-360',
  'nyika-360'
);

update public.podcasts
set access_level = 'premium'
where slug = 'the-living-masks-of-gule-wamkulu';

commit;
