import ds from "@/components/ds/ds.module.css";

/** DS Button classes for plain <a> elements (external links, downloads) that the Button component cannot render. */
export function btnClass(variant: "ink" | "blue" | "outline" | "white" = "ink", size: "sm" | "md" | "lg" = "md", full = false) {
  return [ds.btn, ds[variant], ds[size], full ? ds.full : ""].join(" ");
}
