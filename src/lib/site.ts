// Facts shared across pages. Source: Abdullah Erzin – CV.pdf
export const site = {
  name: 'Abdullah Erzin',
  role: 'Computer vision engineer',
  location: 'Logatec, Slovenia',
  email: 'abdullaherzin80+resume@gmail.com',
  // TODO(abdullah): confirm the mailto subject line (README, open question 6)
  mailSubject: 'Hello from erzn3522.github.io',
  cv: '/cv.pdf',
  description:
    'Abdullah Erzin builds stereo vision and detection systems for agricultural and mobile robots. Computer vision engineer at Pek Automotive in Slovenia.',
  // TODO(abdullah): Medium and Bento are not in the CV. Keep them, or only GitHub + LinkedIn? (README, open question 1)
  links: [
    { label: 'GitHub', href: 'https://github.com/Erzn3522' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abdullah-erzin/' },
    { label: 'Medium', href: 'https://abdullaherzin.medium.com/' },
    { label: 'Bento', href: 'https://bento.me/abdullah-erzin' },
  ],
};

export const mailto = `mailto:${site.email}?subject=${encodeURIComponent(site.mailSubject)}`;
