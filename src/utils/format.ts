export const format_name = (name: string): string => 
  name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, s => s.toUpperCase());

export const cn = (...classes: (string | undefined)[]): string => 
  classes.filter(Boolean).join(' ');
