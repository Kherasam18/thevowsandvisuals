import { Link } from 'react-router-dom';

/**
 * Source: 1px rgba(0,0,0,0.47) border, transparent fill, Garamond 18.21px label.
 * The recordings show it filling maroon (--color_18) with white text on hover.
 */
const CLASSES =
  'inline-flex items-center justify-center border border-black/[0.47] ' +
  'px-[2.1em] py-[0.62em] font-serif text-copy leading-[1.2] text-black ' +
  'transition-colors duration-300 ease-out ' +
  'hover:border-maroon hover:bg-maroon hover:text-white ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon';

export default function Button({ to, href, children, className = '', ...rest }) {
  const cls = `${CLASSES} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
