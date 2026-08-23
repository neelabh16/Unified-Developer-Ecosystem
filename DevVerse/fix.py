import sys

def replace_in_file(filepath, replacements):
    with open(filepath, "r") as f:
        content = f.read()
    
    for old, new in replacements:
        if old not in content:
            print(f"Warning: could not find \n{old.strip()}\n in {filepath}")
        content = content.replace(old, new)
        
    with open(filepath, "w") as f:
        f.write(content)

base_dir = "/Users/nitinkataria/Documents/Sem5BEE/Project/Unified-Developer-Ecosystem/DevVerse"

# index.html
replace_in_file(f"{base_dir}/index.html", [
    (
        "    <div class=\"grid\" style=\"grid-template-columns: 1.5fr 1fr; align-items:start;\">",
        "    <div class=\"detail-grid detail-grid--wide\">"
    ),
    (
        "    <div class=\"grid grid-3\" id=\"trending-projects\"></div>",
        "    <div class=\"grid grid-3\" id=\"trending-projects\">\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n    </div>"
    ),
    (
        "    <div class=\"grid grid-4\" id=\"category-tiles\"></div>",
        "    <div class=\"grid grid-4\" id=\"category-tiles\">\n      <div class=\"home-skel-tile\"></div><div class=\"home-skel-tile\"></div><div class=\"home-skel-tile\"></div><div class=\"home-skel-tile\"></div>\n    </div>"
    ),
    (
        "        <div class=\"grid\" style=\"grid-template-columns:repeat(auto-fit,minmax(140px,1fr));\" id=\"top-devs\"></div>",
        "        <div class=\"grid\" style=\"grid-template-columns:repeat(auto-fit,minmax(140px,1fr));\" id=\"top-devs\">\n          <div class=\"home-skel-dev\"><div class=\"home-skel-avatar\"></div><div class=\"home-skel-text\"></div><div class=\"home-skel-text\"></div></div>\n          <div class=\"home-skel-dev\"><div class=\"home-skel-avatar\"></div><div class=\"home-skel-text\"></div><div class=\"home-skel-text\"></div></div>\n          <div class=\"home-skel-dev\"><div class=\"home-skel-avatar\"></div><div class=\"home-skel-text\"></div><div class=\"home-skel-text\"></div></div>\n        </div>"
    ),
    (
        "    <div class=\"grid grid-3\" id=\"hackathons-preview\"></div>",
        "    <div class=\"grid grid-3\" id=\"hackathons-preview\">\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n    </div>"
    ),
    (
        "    <div class=\"grid grid-4\" id=\"tech-showcase\"></div>",
        "    <div class=\"grid grid-4\" id=\"tech-showcase\">\n      <div class=\"home-skel-tile\"></div><div class=\"home-skel-tile\"></div><div class=\"home-skel-tile\"></div><div class=\"home-skel-tile\"></div>\n    </div>"
    ),
    (
        "    <div class=\"grid grid-3\" id=\"community-highlights\"></div>",
        "    <div class=\"grid grid-3\" id=\"community-highlights\">\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n      <div class=\"home-skel-card\"><div class=\"home-skel-thumb\"></div><div class=\"home-skel-line\"></div><div class=\"home-skel-line\"></div></div>\n    </div>"
    )
])

# leaderboard.html
replace_in_file(f"{base_dir}/leaderboard.html", [
    (
        "    <div class=\"grid\" style=\"grid-template-columns: 2fr 1fr; align-items:start; gap:26px;\">",
        "    <div class=\"detail-grid detail-grid--wide\">"
    )
])

# explore.html
replace_in_file(f"{base_dir}/explore.html", [
    (
        "  <section class=\"wrap section-tight\">",
        "  <section class=\"wrap section-tight\" style=\"padding-top:0;\">"
    )
])

# squads.html
replace_in_file(f"{base_dir}/squads.html", [
    (
        "  <section class=\"wrap page-header\">\n    <div class=\"eyebrow\">Find your people</div>\n    <h1 style=\"font-size:clamp(34px,5vw,54px);\">Squads</h1>\n    <p class=\"lede\">Tell us what you bring and what you're into — we'll score you against every builder on DevVerse, and from there you can message them or form a squad to register for hackathons together.</p>\n  </section>",
        "  <section class=\"wrap page-header\">\n    <div class=\"page-header-split\">\n      <div class=\"page-header-text\">\n        <div class=\"eyebrow\">Find your people</div>\n        <h1 style=\"font-size:clamp(34px,5vw,54px);\">Squads</h1>\n        <p class=\"lede\">Tell us what you bring and what you're into — we'll score you against every builder on DevVerse, and from there you can message them or form a squad to register for hackathons together.</p>\n      </div>\n      <div class=\"page-header-decor\" id=\"squad-decor-panel\" aria-hidden=\"true\"></div>\n    </div>\n  </section>"
    ),
    (
        "  <section class=\"wrap section-tight\" style=\"padding-top:0; max-width:900px;\" id=\"squads-root\"></section>",
        "  <section class=\"wrap section-tight\" style=\"padding-top:0;\" id=\"squads-root\"></section>"
    )
])

# codex.html
replace_in_file(f"{base_dir}/codex.html", [
    (
        "  <section class=\"wrap section-tight\" style=\"padding-top:0; max-width:820px;\" id=\"codex-root\"></section>",
        "  <div class=\"wrap\" id=\"codex-stats-container\" style=\"padding-top:0;\"></div>\n  <section class=\"wrap section-tight\" style=\"padding-top:0; max-width:880px;\" id=\"codex-root\"></section>"
    )
])

# portfolio.html
replace_in_file(f"{base_dir}/portfolio.html", [
    (
        "\n  <section class=\"wrap section-tight\" style=\"padding-top:0;\">\n    <div id=\"portfolio-root\"></div>\n  </section>",
        "\n  <section class=\"wrap section-tight\" style=\"padding-top:0;\">\n    <div id=\"pf-progress-container\"></div>\n    <div id=\"portfolio-root\"></div>\n  </section>"
    )
])

print("Replacements completed.")
