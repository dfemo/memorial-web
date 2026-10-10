const PATHS = {
  home: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8",
  store: "M4 9.5 5.5 4h13L20 9.5M4 9.5h16M5 9.5V20h14V9.5M9.5 20v-5h5v5",
  inbox: "M3.5 13 6 5h12l2.5 8M3.5 13v6h17v-6M3.5 13H8l1.5 2.5h5L16 13h4.5",
  card: "M3 7a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 7v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17zM3 10h18M7 15h3",
  flag: "M5 21V4M5 4.5h11l-2 4 2 4H5",
  settings:
    "M4 7h10M18 7h2M4 12h2M10 12h10M4 17h8M16 17h4M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM12 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z",
  heart:
    "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.500 15.4 12 20 12 20z",
  plus: "M12 5v14M5 12h14",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.500 8.500l-2 5-5 2 2-5z",
  tag: "M3.5 12.500V4.500h8l9 9-8 8zM8 8.500h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.500h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.500 20.500a7.500 7.500 0 0 1 15 0",
  briefcase: "M3.500 8h17v11h-17zM9 8V5.500h6V8M3.500 13h17",
  image: "M4 5h16v14H4zM4 16l4.500-4.500 3.500 3.500 3-3 5 5M9 9.500h.01",
  award: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 13.500 8 21l4-2 4 2-1-7.500",
  logout: "M10 4.500H5.500v15H10M14.500 8l4 4-4 4M18.500 12H9",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600 7 7M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400",
  moon: "M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z",
  monitor: "M3.500 5h17v11h-17zM9 20h6M12 16v4",
  palette:
    "M12 3.500a8.500 8.500 0 1 0 0 17c1.500 0 2-1 2-2 0-1.500-1-1.500-1-3s1-2 2.500-2h1.500a3.500 3.500 0 0 0 3.500-3.500c0-3.600-3.800-6.500-8.500-6.500zM8 10.500h.01M12 8h.01M16 10.500h.01",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-right": "m9 6 6 6-6 6",
  "chevrons-left": "m11 7-5 5 5 5M18 7l-5 5 5 5",
  "chevrons-right": "m6 7 5 5-5 5M13 7l5 5-5 5",
  menu: "M4 7h16M4 12h16M4 17h16",
  filter: "M4 6h16M7 12h10M10 18h4",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  x: "M6 6l12 12M18 6 6 18",
  list: "M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01",
  external: "M14 4.500h5.500V10M19.500 4.500 11 13M18 14v5.500H4.500V6H10",
  collapse: "M4 9h16M4 15h16M9 5l3 3 3-3M9 19l3-3 3 3",
  expand: "M4 12h16M9 7l3-3 3 3M9 17l3 3 3-3",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
