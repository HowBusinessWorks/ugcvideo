;
export default function Footer({ footerNavigation }) {
    return (<div className='mx-auto mt-6 max-w-7xl px-6 lg:px-8 dark:bg-boxdark-2'>
      <footer aria-labelledby='footer-heading' className='relative border-t border-gray-900/10 dark:border-gray-200/10 py-24 sm:mt-32'>
        <h2 id='footer-heading' className='sr-only'>
          Footer
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mt-10'>
          <div className='md:col-span-2'>
            <div className='flex items-center mb-4'>
              <span className='text-xl font-bold text-gray-900 dark:text-white'>UGCVideo</span>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-300 max-w-md'>
              Generate authentic UGC-style videos with AI. Perfect for social media marketing, product demos, and building trust with your audience.
            </p>
            <div className='mt-6'>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                © 2024 UGCVideo. All rights reserved.
              </p>
            </div>
          </div>
          <div>
            <h3 className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>Company</h3>
            <ul role='list' className='mt-6 space-y-4'>
              {footerNavigation.company.map((item) => (<li key={item.name}>
                  <a href={item.href} className='text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-white transition-colors'>
                    {item.name}
                  </a>
                </li>))}
            </ul>
          </div>
          <div>
            <h3 className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'>Contact Us</h3>
            <ul role='list' className='mt-6 space-y-4'>
              <li>
                <a href='mailto:hello@ugcvideo.com' className='text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-white transition-colors'>
                  hello@ugcvideo.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>);
}
