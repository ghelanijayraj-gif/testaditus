/* @ds-bundle: {"format":4,"namespace":"ADITUSDesignSystem_884a4c","components":[{"name":"AditusMark","sourcePath":"components/brand/AditusMark.jsx"},{"name":"CategoryCard","sourcePath":"components/cards/CategoryCard.jsx"},{"name":"EventCard","sourcePath":"components/cards/EventCard.jsx"},{"name":"PathCard","sourcePath":"components/cards/PathCard.jsx"},{"name":"PracticeCard","sourcePath":"components/cards/PracticeCard.jsx"},{"name":"ProductCard","sourcePath":"components/cards/ProductCard.jsx"},{"name":"ImageSlot","sourcePath":"components/content/ImageSlot.jsx"},{"name":"SectionHeader","sourcePath":"components/content/SectionHeader.jsx"},{"name":"SpecList","sourcePath":"components/content/SpecList.jsx"},{"name":"StepList","sourcePath":"components/content/StepList.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Label","sourcePath":"components/core/Label.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"TextLink","sourcePath":"components/core/TextLink.jsx"},{"name":"EmailSignup","sourcePath":"components/forms/EmailSignup.jsx"},{"name":"OptionRow","sourcePath":"components/forms/OptionRow.jsx"},{"name":"ProgressBar","sourcePath":"components/forms/ProgressBar.jsx"},{"name":"VariantSelector","sourcePath":"components/forms/VariantSelector.jsx"},{"name":"CategoryBar","sourcePath":"components/navigation/CategoryBar.jsx"},{"name":"SiteFooter","sourcePath":"components/navigation/SiteFooter.jsx"},{"name":"SiteNav","sourcePath":"components/navigation/SiteNav.jsx"}],"sourceHashes":{"assets/data/aditus-shared.js":"1b7175d0d057","assets/image-slot.js":"fff26d081c8d","components/brand/AditusMark.jsx":"149cc6f7c559","components/cards/CategoryCard.jsx":"c95c90d2e440","components/cards/EventCard.jsx":"d707765945bc","components/cards/PathCard.jsx":"cb3764a2e97f","components/cards/PracticeCard.jsx":"f71567272ee7","components/cards/ProductCard.jsx":"1b52bd74ac1e","components/content/ImageSlot.jsx":"63bc17439615","components/content/SectionHeader.jsx":"fbc8ebc06d3f","components/content/SpecList.jsx":"3d077bad8015","components/content/StepList.jsx":"7b190e40343d","components/core/Button.jsx":"43ffbf00eb87","components/core/Label.jsx":"c4535e2e3525","components/core/Pill.jsx":"d018d168ee41","components/core/Tag.jsx":"b30357eb2e76","components/core/TextLink.jsx":"940fd4e51e2b","components/forms/EmailSignup.jsx":"43b5e2f4acd4","components/forms/OptionRow.jsx":"fff104a1516d","components/forms/ProgressBar.jsx":"ce6dc1cf38fd","components/forms/VariantSelector.jsx":"3496bdf111f5","components/navigation/CategoryBar.jsx":"e1d30cb1d8db","components/navigation/SiteFooter.jsx":"50417e3a4f04","components/navigation/SiteNav.jsx":"ea580aa9dec2","ui_kits/website/About.jsx":"75fe5ab3b90a","ui_kits/website/Account.jsx":"e1d160663b9e","ui_kits/website/Assessment.jsx":"e95d5fa24494","ui_kits/website/Community.jsx":"11ce03a4020e","ui_kits/website/Home.jsx":"b26abf765bec","ui_kits/website/Library.jsx":"a3b9c437fd1d","ui_kits/website/PlatformMap.jsx":"c5f30d0ac0d0","ui_kits/website/Product.jsx":"3baea571f76a","ui_kits/website/Qualify.jsx":"d0487e44ec62","ui_kits/website/Shop.jsx":"1211eab94181","ui_kits/website/Training.jsx":"cc674bcc6d8d","ui_kits/website/data.js":"4dec11ca26aa"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ADITUSDesignSystem_884a4c = window.ADITUSDesignSystem_884a4c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/data/aditus-shared.js
try { (() => {
/* ADITUS shared content model + render helpers.
   Model: ONE BODY → FOUR SYSTEMS (movement, breathwork, recovery, recovery) → topics.
   Community surrounds the systems. Relationships are id references resolved by helpers — layouts never hard-code them:
   SYSTEM ← ASSESSMENT AREA ← PRACTICE → PRODUCT → ARTICLE → EVENT / GROUP SESSION. */
(function () {
  const fmt = p => p === 0 ? 'Free' : '₹' + (p / 100).toLocaleString('en-IN');

  // Four verticals. Longevity is the OUTCOME of all four over time, not a vertical.
  const SYSTEMS = {
    movement: {
      id: 'movement',
      name: 'Movement',
      line: 'How you move, load and get around.',
      topics: ['Strength', 'Mobility', 'Biomechanics', 'Posture', 'Gait', 'Balance', 'Feet', 'Fascia & tissue'],
      what: 'Strength, mobility, coordination, balance, gait and the connective tissue that transfers force. Much more than stretching or drills.',
      why: 'It’s what you actually use — to carry, climb, run, play and get up off the floor.',
      changes: 'More usable range, more strength through it, and fewer workarounds.'
    },
    breathwork: {
      id: 'breathwork',
      name: 'Breath',
      line: 'How you breathe under effort and at rest.',
      topics: ['Mechanics', 'Endurance', 'Effort', 'Regulation', 'Sleep'],
      what: 'Breathing mechanics, respiratory efficiency, effort regulation and how quickly you settle after exertion.',
      why: 'Breath sets trunk pressure and position, and it’s the fastest lever you have on effort and stress.',
      changes: 'Steadier under load, longer before you fade, faster back to baseline.'
    },
    recovery: {
      id: 'recovery',
      name: 'Recovery',
      line: 'How you adapt to the work.',
      topics: ['Sleep', 'Load', 'Active recovery', 'Nutrition', 'Cold & heat', 'Technology'],
      what: 'Sleep, rest, load management, active recovery, hydration, nutrition, cold, heat and the tools around them.',
      why: 'Training is the stimulus. Recovery is where the body actually adapts to it.',
      changes: 'Progress that sticks, fewer weeks lost to fatigue, more energy for everything else.'
    },
    performance: {
      id: 'performance',
      name: 'Performance',
      line: 'How much you can do, and for how long.',
      topics: ['Strength', 'Endurance', 'Power', 'Sport', 'Resilience'],
      what: 'Physical capacity: strength, endurance, resilience and athletic ability — the room to do more of what you enjoy.',
      why: 'Capacity is what lets you say yes: to the trek, the match, the climb, the extra set.',
      changes: 'More strength and endurance, and the confidence to use them.'
    }
  };
  const OUTCOME = {
    name: 'Sustainable longevity',
    line: 'What movement, breath, recovery and performance build together, over years.'
  };
  const SYS_ORDER = ['movement', 'breathwork', 'recovery', 'performance'];
  const AREAS = {
    'hip-rotation': {
      id: 'hip-rotation',
      name: 'Hip rotation',
      system: 'movement'
    },
    'foot-function': {
      id: 'foot-function',
      name: 'Foot function',
      system: 'movement'
    },
    'posture-load': {
      id: 'posture-load',
      name: 'Posture under load',
      system: 'movement'
    },
    'rib-expansion': {
      id: 'rib-expansion',
      name: 'Ribcage expansion',
      system: 'breathwork'
    },
    'sleep': {
      id: 'sleep',
      name: 'Sleep & downregulation',
      system: 'recovery'
    }
  };
  const PRINCIPLE = {
    "loaded-carry": "Performance — strength you can carry into everyday life.",
    "foot-calf-release": "Ground interaction — preparing the foot and calf so they can load and adapt.",
    "hip-rotation": "Movement options — controlled rotation so the knees and back don’t do the hip’s job.",
    "short-foot-drill": "Gait and loading — a foot that holds its shape under you.",
    "thoracic-open-book": "Movement options — an upper back that rotates, so the neck and lower back don’t have to.",
    "90-90-breathing": "Mechanics and pressure — ribs that move, so the trunk can stabilise and you can breathe under load.",
    "crocodile-breathing": "Mechanics and pressure — even expansion around the trunk.",
    "extended-exhale": "Recovery after effort — a reliable way to bring effort down.",
    "legs-up-downregulation": "Recovery — coming down after training so sleep and adaptation can start.",
    "evening-wind-down": "Recovery — protecting the sleep where adaptation happens.",
    "cold-exposure-intro": "Recovery and stress tolerance — staying controlled when your body wants to panic.",
    "morning-light-walk": "Recovery — anchoring the body clock that governs sleep."
  };
  const X = (id, no, name, primary, topic, dur, equip, level, when, why, how, tempo, dosage, notice, errors, related, areas, articles, events) => ({
    id,
    no,
    name,
    primary,
    topic,
    dur,
    equip,
    level,
    when,
    why,
    principle: PRINCIPLE[id] || '',
    trains: topic,
    relates: '',
    setup: how.slice(0, 1),
    perform: how.slice(1),
    how,
    breathing: tempo,
    dosage,
    notice,
    errors,
    related,
    areas,
    articles,
    events,
    ph: 'Video: ' + name + ', demonstration, natural light'
  });
  const EXERCISES = [X('loaded-carry', '090', 'Loaded Carry', 'performance', 'Strength', '8 min', ['loop-band'], 'All levels', 'End of a training session, 2–3× a week.', 'Carrying is the most useful strength there is: bags, kids, luggage, kit. It trains grip, trunk and gait under load at the same time.', ['Pick up two heavy weights. Stand tall.', 'Walk 20–30 m with short, quiet steps.', 'Put them down with control. Rest and repeat.'], 'Steady nasal breathing. Don’t hold it.', '4 × 30 m, heavy enough that the last 5 m are hard.', ['Ribs stacked over pelvis', 'Feet landing quietly'], ['Leaning to one side', 'Shrugging the shoulders'], ['movement', 'breathwork'], ['posture-load'], ['capability-is-trainable'], ['fundamentals']), X('foot-calf-release', '022', 'Foot & Calf Release', 'movement', 'Fascia', '8 min', ['fascia-ball'], 'Beginner', 'Before training, or at the end of a day in shoes.', 'Foot and calf share continuous tissue. When it’s stiff, the ankle loses range and the foot stops adapting to the ground.', ['Stand by a wall. Ball under the arch.', 'Let weight sink in for 30 s at three points.', 'Sit, ball under the calf, slowly rotate the foot in and out.'], 'Slow nasal breathing. Exhale into each point.', '2 min per foot, 2 min per calf.', ['Warmth spreading through the foot', 'More ankle bend afterwards'], ['Rolling fast', 'Pushing into sharp pain'], ['breathwork'], ['foot-function'], ['fascia-during-movement', 'why-train-feet'], ['feet-workshop']), X('hip-rotation', '031', '90/90 Hip Rotation', 'movement', 'Hips', '6 min', ['loop-band'], 'Beginner', 'As part of a warm-up, or on its own 4× a week.', 'Walking, running and turning need the hips to rotate. When they can’t, the knees and lower back do it instead.', ['Sit with both knees at 90°, one in front, one to the side.', 'Sit tall. Rotate both knees to the other side without your hands.', 'Stop where you lose control, not where you run out of range.'], 'Exhale as you rotate. Inhale once you arrive.', '3 × 6 transitions per side.', ['Which side is harder to control', 'Whether your trunk leans to cheat'], ['Leaning back on your hands', 'Rushing the hard part'], ['breathwork'], ['hip-rotation'], ['aditus-mobility', 'posture-under-load'], ['mobility-lab']), X('short-foot-drill', '044', 'Short Foot Drill', 'movement', 'Feet', '5 min', ['toe-spacers'], 'Beginner', 'Daily. Barefoot, before you put shoes on.', 'Your foot is the first thing that meets the ground. This wakes up the small muscles that hold its shape.', ['Stand barefoot, feet hip-width.', 'Without curling the toes, draw the ball of the foot towards the heel.', 'Hold 5 s. Relax fully.'], 'Breathe normally. No holding.', '2 × 10 per foot.', ['Arch lifting without toes gripping'], ['Curling the toes', 'Rolling onto the outer foot'], [], ['foot-function'], ['why-train-feet'], ['feet-workshop']), X('thoracic-open-book', '063', 'Thoracic Open Book', 'movement', 'Spine', '5 min', ['duo-ball-08'], 'Beginner', 'After long sitting. Before overhead or rotational training.', 'Your upper back is meant to rotate. When it doesn’t, your neck and lower back rotate for it.', ['Lie on your side, knees stacked at 90°.', 'Open the top arm across, eyes follow the hand.', 'Two breaths at the end. Return.'], 'Exhale as you open.', '8 per side.', ['Rotation coming from the upper back'], ['Knees lifting apart', 'Forcing the arm down'], ['breathwork'], ['posture-load'], ['posture-under-load', 'ribcage-mechanics'], ['mobility-lab']), X('90-90-breathing', '014', '90/90 Breathing', 'breathwork', 'Expansion', '5 min', [], 'Beginner', 'Before training, or any time your breathing feels high and tight.', 'Most people breathe into the front of the chest. This position gives the ribs a reason to move backwards and sideways again.', ['Lie on your back, feet on a wall, hips and knees at 90°.', 'Exhale fully through the mouth. Let the ribs drop.', 'Pause, then inhale through the nose into the back of the ribs.'], 'In 4 · out 6–8 · pause 2.', '4 rounds × 5 breaths, daily.', ['Ribs dropping on the exhale', 'Pressure into the floor behind your ribs'], ['Arching the lower back', 'Straining the neck'], ['movement'], ['rib-expansion'], ['ribcage-mechanics'], ['breath-session']), X('crocodile-breathing', '019', 'Crocodile Breathing', 'breathwork', 'Pressure', '5 min', [], 'Beginner', 'Warm-ups, or to learn even trunk pressure.', 'Face down, the belly can’t push forwards — breath has to move your back and sides.', ['Lie face down, forehead on your hands.', 'Inhale through the nose. Feel the lower back rise.', 'Exhale slowly. Let everything soften.'], 'In 4 · out 6.', '2 × 10 breaths.', ['Lower back and sides rising'], ['Squeezing the glutes', 'Lifting the head'], ['movement'], ['rib-expansion'], ['ribcage-mechanics'], ['breath-session']), X('extended-exhale', '025', 'Extended Exhale', 'breathwork', 'Regulation', '4 min', ['nasal-strips'], 'All levels', 'After hard sessions, or before sleep.', 'A longer exhale is the simplest way to tell your body the effort is over.', ['Sit or lie comfortably.', 'Inhale through the nose for 4.', 'Exhale through the nose for 8. Repeat.'], 'In 4 · out 8.', '3–5 minutes.', ['Heart rate settling', 'Shoulders dropping'], ['Forcing the inhale', 'Breath holds between'], ['recovery'], ['sleep'], ['sleep-adaptation'], ['recovery-session']), X('legs-up-downregulation', '052', 'Legs-Up Downregulation', 'recovery', 'Downregulation', '10 min', [], 'All levels', 'Evenings, or after training.', 'Lying still with legs supported is an easy way to come down after effort.', ['Lie on your back, legs up a wall.', 'Arms by your sides, palms up.', 'Breathe slowly through the nose.'], 'Slow nasal breathing, long exhale.', '8–10 minutes.', ['Breathing slowing on its own'], ['Scrolling your phone'], ['breathwork'], ['sleep'], ['sleep-adaptation'], ['recovery-session']), X('evening-wind-down', '058', 'Evening Wind-Down', 'recovery', 'Sleep', '15 min', ['evening-amber-frames'], 'All levels', 'The last hour before bed.', 'Sleep is where adaptation happens. The hour before it decides how good it is.', ['Dim the lights. Amber lenses on.', '5 min of gentle mobility on the floor.', '5 min extended-exhale breathing.'], 'In 4 · out 8.', 'Nightly.', ['Falling asleep sooner'], ['Bright screens right up to bed'], ['breathwork', 'recovery'], ['sleep'], ['sleep-adaptation'], ['recovery-session']), X('cold-exposure-intro', '081', 'Cold Exposure: Starting Out', 'recovery', 'Cold & heat', '3 min', [], 'Intermediate', 'Mornings, away from strength sessions.', 'Cold trains you to stay calm under stress. It isn’t a cure for anything — it’s practice.', ['End a warm shower with 30 s of cold.', 'Keep your breathing slow and controlled.', 'Add 15 s each week, up to 2 minutes.'], 'Slow nasal exhale. Don’t gasp.', '3–4× a week.', ['Breath settling after the first 15 s'], ['Hyperventilating', 'Going straight to ice baths'], ['breathwork'], [], ['cold-exposure-where-it-fits'], ['run-plunge']), X('morning-light-walk', '084', 'Morning Light Walk', 'recovery', 'Sleep', '15 min', [], 'All levels', 'Within an hour of waking.', 'Outdoor light early in the day is one of the strongest signals for your body clock.', ['Walk outside within an hour of waking.', 'No sunglasses unless needed for safety.', 'Nasal breathing, easy pace.'], 'Easy nasal breathing.', '10–20 minutes, daily.', ['Waking up more easily over a week'], ['Staying indoors behind glass'], ['recovery'], ['sleep'], ['sleep-adaptation'], ['open-practice'])];
  const P = (id, name, type, system, topic, price, variants, usedFor, why, specs, howTo, articles, related, secondary) => ({
    id,
    name,
    type,
    system,
    topic,
    price,
    variants,
    usedFor,
    why,
    specs,
    howTo,
    articles,
    related,
    secondary,
    ph: name + ' — product photography, natural light'
  });
  const PRODUCTS = [P('fascia-ball', 'Fascia Ball', 'Balls', 'movement', 'Fascia / mobility', 120000, ['Soft', 'Standard', 'Firm'], 'Self-myofascial work', 'Slow, precise pressure under the foot, along the calf, around the hip — where a roller can’t reach.', [['Material', 'EPP foam'], ['Diameter', '8 cm'], ['Weight', '28 g'], ['Care', 'Wipe clean']], ['Find the point, then stop moving.', 'Exhale and let your weight sink in.', 'Small movements. 30–90 s per point.'], ['fascia-during-movement', 'why-train-feet'], ['duo-ball-08', 'toe-spacers']), P('duo-ball-08', 'Duo Ball 08', 'Balls', 'movement', 'Spine / mobility', 190000, ['Soft', 'Standard', 'Firm'], 'Spine and neck release', 'Two balls joined, so you work either side of the spine without pressing on bone.', [['Material', 'EPP foam'], ['Dimensions', '16 × 8 × 8 cm'], ['Weight', '62 g']], ['Either side of the spine.', 'Hold each point 30–90 s.', 'One segment at a time.'], ['posture-under-load'], ['fascia-ball']), P('loop-band', 'Loop Band Set', 'Bands', 'movement', 'Hips / loaded mobility', 180000, ['4-band set'], 'Loaded mobility', 'Just enough resistance to train control at the end of your range.', [['Material', 'Natural latex'], ['Set', '4 resistances']], ['Anchor securely.', 'Pick a band you control at end range.', 'Slow reps beat heavy reps.'], ['aditus-mobility'], ['fascia-ball']), P('toe-spacers', 'Toe Spacers', 'Toe spacers', 'movement', 'Feet / ground interaction', 220000, ['S', 'M', 'L'], 'Foot practice', 'Shoes squash your toes together. Spacers give them room so the foot holds its shape again.', [['Material', 'Medical-grade silicone'], ['Weight', '38 g / pair']], ['Start with 10–20 min a day.', 'Walk around at home once comfortable.', 'Pair with the Short Foot Drill.'], ['why-train-feet'], ['fascia-ball']), P('nasal-strips', 'Nasal Strips · 30', 'Breathing tools', 'breathwork', 'Mechanics', 110000, ['M', 'L'], 'Nasal breathing', 'Makes nasal breathing easier while you learn to keep it during effort.', [['Pack', '30 strips']], ['Apply to clean, dry skin.', 'Use for training and sleep.'], ['ribcage-mechanics'], []), P('compression-boots', 'Compression Boots', 'Recovery tools', 'recovery', 'Post-training', 6400000, ['One size'], 'Post-training recovery', 'Sequential compression for legs after hard blocks of training.', [['Sizes', 'Fits 150–200 cm'], ['Battery', '4 h']], ['20–30 min after training.', 'Legs flat, relaxed.'], ['sleep-adaptation'], ['recovery-pillow']), P('recovery-pillow', 'Recovery Pillow', 'Sleep', 'recovery', 'Sleep', 650000, ['Standard'], 'Sleep position', 'Keeps the neck in line for side and back sleepers.', [['Fill', 'Latex'], ['Cover', 'Organic cotton']], ['Side or back sleeping.'], ['sleep-adaptation'], ['evening-amber-frames']), P('evening-amber-frames', 'Evening Amber Frames', 'Eyewear', 'recovery', 'Sleep / light', 890000, ['Black', 'Tortoise'], 'Evening light management', 'Amber lenses filter blue light in the hour or two before sleep.', [['Lens', 'Amber'], ['Frame', 'Acetate'], ['Weight', '26 g']], ['Wear for the last 1–2 h before bed.', 'Not for night driving.'], ['sleep-adaptation'], ['recovery-pillow'], 'recovery')];
  const A_ = (id, kind, cat, system, title, intro, author, date, read, body, pull, exercises, products, ph) => ({
    id,
    kind,
    cat,
    system,
    title,
    intro,
    author,
    date,
    read,
    body,
    pull,
    exercises,
    products,
    ph
  });
  const ARTICLES = [A_('capability-is-trainable', 'education', 'Training', 'movement', 'What we mean by capability', 'Why capability is more useful than “fitness”, and why it’s more useful than "fitness".', 'Meera Rao', '3 Oct 2026', '5 min', ['Capability is what your body lets you do: carry the bags, take the stairs two at a time, play with your kids, finish the trek.', 'It’s built from movement, breath and recovery working together — and it responds to training at any age.', 'Longevity isn’t a separate goal. It’s what happens when you keep that capability for decades.'], 'Longevity is what happens when you keep capability for decades.', ['hip-rotation', '90-90-breathing', 'evening-wind-down'], ['loop-band'], 'PHOTO: EVERYDAY — carrying, climbing, playing'), A_('posture-under-load', 'education', 'Movement', 'movement', 'Why posture changes under load', 'Good posture standing still tells you very little. What matters is what happens when you carry, lift and run.', 'Meera Rao', '2 Oct 2026', '6 min', ['Under load, your body chooses the position it can control — not the one you were told to hold.', 'That’s why we assess posture while you move, not while you stand for a photo.', 'Change what you can control, and the position changes with it.'], 'Your body chooses the position it can control.', ['thoracic-open-book', 'hip-rotation'], ['duo-ball-08'], 'Editorial: loaded carry, side view, studio light'), A_('fascia-during-movement', 'education', 'Movement', 'movement', 'What fascia actually does during movement', 'Fascia is part of Movement — not a separate system, and not magic.', 'Kavya Iyer', '26 Sep 2026', '7 min', ['Fascia links muscles, bones and organs. It helps transmit force and lets tissue slide.', 'It responds to how you load it. It doesn’t “release toxins” or need breaking up.', 'We train it the way we train everything else in Movement: range, load and control.'], 'It responds to how you load it.', ['foot-calf-release'], ['fascia-ball'], 'Macro: translucent connective tissue'), A_('ribcage-mechanics', 'education', 'Breath', 'breathwork', 'How ribcage mechanics influence movement', 'Your ribs are meant to move in every direction when you breathe. Most of ours have stopped.', 'Arjun Mehta', '20 Sep 2026', '5 min', ['When the ribs only move up and forwards, pressure builds in the wrong places.', 'Expansion into the back and sides gives the spine and shoulders a better base.', 'This isn’t meditation. It’s mechanics.'], 'This isn’t meditation. It’s mechanics.', ['90-90-breathing', 'crocodile-breathing'], ['nasal-strips'], 'Editorial: hands on ribcage, side light'), A_('sleep-adaptation', 'education', 'Recovery', 'recovery', 'Sleep and adaptation', 'Training is the stimulus. Sleep is where your body actually adapts.', 'Arjun Mehta', '12 Sep 2026', '6 min', ['Hard training with poor sleep usually means slower progress and more niggles.', 'Most of what helps is boring: regular times, darker evenings, a cooler room.', 'We treat sleep as part of the training plan, not an afterthought.'], 'Sleep is part of the training plan.', ['evening-wind-down', 'extended-exhale'], ['evening-amber-frames', 'recovery-pillow'], 'Editorial: linen bedroom, early light'), A_('cold-exposure-where-it-fits', 'education', 'Recovery', 'recovery', 'Cold exposure: where it fits and where it doesn’t', 'Cold is a useful practice for staying calm under stress. It’s not a cure for anything.', 'Meera Rao', '4 Sep 2026', '6 min', ['Short, controlled cold exposure trains you to breathe slowly when your body wants to panic.', 'Straight after strength training it may blunt some of the adaptation — so we keep them apart.', 'Start small. The breathing matters more than the temperature.'], 'The breathing matters more than the temperature.', ['cold-exposure-intro'], [], 'Documentary: cold plunge at dawn, breath visible'), A_('why-train-feet', 'education', 'Movement', 'movement', 'Why we train the feet', 'Your feet are the first thing that meets the ground — and the last thing most programmes train.', 'Kavya Iyer', '28 Aug 2026', '5 min', ['A foot that can spread, grip and adapt changes how force travels up the leg.', 'Years in shoes make feet stiff and quiet.', 'Release the tissue, give the toes room, then train control.'], 'Release, give room, then train control.', ['short-foot-drill', 'foot-calf-release'], ['toe-spacers', 'fascia-ball'], 'Editorial: bare feet on sand'), A_('aditus-mobility', 'education', 'Training', 'movement', 'How ADITUS approaches mobility', 'Range you can’t control isn’t much use. We train mobility actively.', 'Meera Rao', '20 Aug 2026', '5 min', ['Passive stretching gets you into positions. Active mobility lets you use them.', 'We release, then move into the new range, then load it.', 'That order matters more than any single exercise.'], 'Release, move, load.', ['hip-rotation', 'foot-calf-release'], ['loop-band'], 'Coach cueing hip mobility, documentary'), A_('story-700-plunge', 'story', 'Community', null, '700 people, one plunge, one breath', 'A cold-water morning in Mumbai, and what it looked like when practice is shared.', 'ADITUS Community', '1 Oct 2026', '4 min', ['At 6 a.m. on Carter Road, 700 people stood at the water’s edge and breathed together.', 'Nobody was trying to be a guru. Most were just trying not to swear.', 'This is what practice looks like when it’s shared.'], 'Most were just trying not to swear.', ['cold-exposure-intro'], [], 'Documentary: crowd entering the sea at dawn')];
  const E = (id, title, cat, system, date, time, place, price, req, desc, kind) => ({
    id,
    title,
    cat,
    system,
    date,
    time,
    place,
    price,
    req,
    desc,
    kind: kind || cat
  });
  const EVENTS = [E('fundamentals', 'Fundamentals', 'Movement', 'movement', 'Tue & Thu', '07:00', 'ADITUS Bandra', 450000, 'After assessment', 'The core ADITUS method in a small group. 8 people, 6 weeks.', 'Group training'), E('mobility-lab', 'Mobility Lab', 'Mobility', 'movement', 'Every Wed', '18:30', 'ADITUS Bandra', 150000, 'Open to all', 'Hips, spine and feet. Release, move, load.', 'Group training'), E('breath-session', 'Breath Session', 'Breath', 'breathwork', 'Every Sat', '08:00', 'Indiranagar, Bengaluru', 150000, 'Open to all', 'Mechanics first, then breathing under load and effort.', 'Group training'), E('recovery-session', 'Recovery: Heat & Cold', 'Recovery', 'recovery', 'Every Sun', '17:00', 'ADITUS Bandra', 250000, 'Open to all', 'Downregulation, heat, cold. Slow and guided.', 'Group training'), E('feet-workshop', 'Feet & Foundation Workshop', 'Workshops', 'movement', 'Sat 31 Oct', '09:00', 'ADITUS Bandra', 350000, 'Open to all', 'Two hours on the most ignored part of your body.', 'Workshop'), E('run-plunge', 'Run & Plunge', 'Community', 'recovery', 'Sat 17 Oct', '06:00', 'Carter Road, Mumbai', 200000, 'Open to all', '5 km easy, then the sea. Breathing guided.', 'Event'), E('intro-session', 'Introduction to ADITUS', 'Community', null, 'Thu 15 Oct', '19:00', 'ADITUS Bandra', 0, 'Open to all', 'Meet the coaches. Try the method. Ask anything.', 'Event'), E('open-practice', 'Open Practice', 'Community', 'movement', 'Every Sun', '07:00', 'Juhu Beach, Mumbai', 0, 'Open to all', 'Free, outdoors, everyone welcome.', 'Event')];
  const PRACTITIONERS = [{
    id: 'meera',
    name: 'Meera Rao',
    role: 'Movement specialist',
    bio: 'Ten years coaching runners and climbers. Obsessed with hips.'
  }, {
    id: 'arjun',
    name: 'Arjun Mehta',
    role: 'Breathwork coach',
    bio: 'Former competitive swimmer. Teaches breathing as mechanics, not mysticism.'
  }, {
    id: 'kavya',
    name: 'Kavya Iyer',
    role: 'Physiotherapist',
    bio: 'Works between rehab and performance. Will make you take your shoes off.'
  }];
  const TRAINING = {
    personal: {
      id: 'personal',
      name: 'Personal Training',
      line: 'Individual training built from your assessment.',
      from: 'From ₹XX,XXX / month'
    },
    group: {
      id: 'group',
      name: 'Group Training',
      line: 'The ADITUS method, practised with others.',
      from: 'From ₹X,XXX / month'
    }
  };
  const ASSESSMENT = {
    id: 'A-2026-1022',
    date: '22 October 2026',
    practitioner: 'Meera Rao',
    format: 'In-centre · ADITUS Bandra',
    next: 'Reassessment after 8–10 weeks of training',
    summary: 'You move well in straight lines and you’re strong. Rotation is the gap: your right hip loses control halfway, and your ribcage stays fixed at the back when you breathe. Your sleep is short on training days, which fits with how slowly you recover from hard sessions. All of it is trainable.',
    path: 'personal',
    pathReason: 'Your hip and breathing priorities need hands-on coaching for the first block. Fundamentals Group Training is a good next step after six weeks.',
    priorities: [{
      n: '01',
      title: 'Controlled hip rotation, right side',
      system: 'movement',
      area: 'hip-rotation'
    }, {
      n: '02',
      title: 'Get the back of the ribcage moving',
      system: 'breathwork',
      area: 'rib-expansion'
    }, {
      n: '03',
      title: 'Protect sleep on training days',
      system: 'recovery',
      area: 'sleep'
    }],
    findings: [{
      system: 'movement',
      observation: 'Limited control through right hip rotation; stiff right foot.',
      saw: 'You lose control halfway through 90/90 transitions on the right, and the right arch stays rigid when you shift weight.',
      why: 'Without rotation, the lower back and knee do the turning.',
      improve: 'Active hip rotation with control, and a foot that adapts to the ground.',
      practice: ['hip-rotation', 'foot-calf-release']
    }, {
      system: 'breathwork',
      observation: 'Breath moves mostly into the upper chest.',
      saw: 'Little expansion at the back of the ribs; neck muscles working on every inhale.',
      why: 'A fixed ribcage limits upper-back rotation and how you manage pressure under load.',
      improve: 'Posterior rib expansion and a longer, controlled exhale.',
      practice: ['90-90-breathing']
    }, {
      system: 'recovery',
      observation: 'Short sleep on training days.',
      saw: 'You report 5–6 h on evening-training days and feel flat the next morning.',
      why: 'Adaptation happens in recovery. Without it, training just adds fatigue.',
      improve: 'A consistent wind-down and earlier sessions where possible.',
      practice: ['evening-wind-down']
    }],
    plan: [{
      ex: '90-90-breathing',
      presc: {
        sets: '4 rounds',
        reps: '5 breaths',
        freq: 'Daily'
      },
      why: 'Priority 02 — ribcage stays fixed at the back.',
      note: 'Slow the exhale right down. If your neck switches on, start again.'
    }, {
      ex: 'hip-rotation',
      presc: {
        sets: '3 sets',
        reps: '6 per side',
        freq: '4× per week'
      },
      why: 'Priority 01 — right hip loses control halfway.',
      note: 'Lightest band. Control over range.'
    }, {
      ex: 'foot-calf-release',
      presc: {
        sets: '1 round',
        reps: '2 min per area',
        freq: 'Daily, evenings'
      },
      why: 'Priority 01 — stiff right foot feeds the hip.',
      note: 'Twice as long on the right.'
    }, {
      ex: 'evening-wind-down',
      presc: {
        sets: '1',
        reps: '15 min',
        freq: 'Training days'
      },
      why: 'Priority 03 — short sleep after evening training.',
      note: 'Amber lenses on at 9:30.'
    }]
  };
  const STORIES = [{
    id: 'story-runner-knee',
    kind: 'client',
    name: 'Aisha, 34',
    title: 'Running again without the knee',
    training: 'Personal Training',
    systems: ['movement', 'performance'],
    desc: 'Marathon runner. Twelve weeks from a stalled comeback to 10 km pain-free.',
    assessed: 'Right hip lost control in rotation; stiff right foot; short sleep on long-run days.',
    changed: '10 km pain-free at week 12. Back to two long runs a week.',
    context: 'Aisha had stopped running after a year of on-off knee pain. Rest helped; running brought it straight back.',
    trained: 'Right hip rotation and foot control first, then loading the knee through range. Sleep on long-run days.',
    process: 'Assessment → 12 weeks Personal Training, twice a week → reassessment at week 10.',
    practice: ['hip-rotation', 'short-foot-drill', 'foot-calf-release'],
    ph: 'PHOTO: CLIENT — Aisha running on Carter Road, early light'
  }, {
    id: 'story-desk-climber',
    kind: 'client',
    name: 'Dev, 41',
    title: 'From desk stiffness to climbing twice a week',
    training: 'Group Training',
    systems: ['movement', 'breathwork'],
    desc: 'Software lead. Upper back and breathing were the gap.',
    assessed: 'Upper back barely rotated; breath stayed high in the chest overhead.',
    changed: 'Climbing twice a week without neck pain; first V4 in month three.',
    context: 'Ten hours a day at a desk and a climbing habit that kept ending in a stiff neck.',
    trained: 'Thoracic rotation, posterior rib expansion and shoulder control overhead.',
    process: 'Assessment → Fundamentals group, 2 blocks → Mobility Lab weekly.',
    practice: ['thoracic-open-book', '90-90-breathing'],
    ph: 'PHOTO: CLIENT — Dev on the wall at the climbing gym'
  }, {
    id: 'story-sleep-founder',
    kind: 'client',
    name: 'Neha, 46',
    title: 'Training that finally stuck',
    training: 'Personal Training',
    systems: ['recovery', 'performance'],
    desc: 'Founder. Recovery, not effort, was the limit.',
    assessed: 'Good strength, poor recovery: 5 h sleep and slow return to baseline.',
    changed: 'Sleep up to 7 h on most nights; training load up 30% without stalling.',
    context: 'Hard sessions, five hours of sleep, and progress that kept stalling.',
    trained: 'Evening downregulation, earlier training slots and a cold-exposure practice she could keep.',
    process: 'Assessment → Personal Training once a week → Recovery sessions.',
    practice: ['evening-wind-down', 'extended-exhale', 'cold-exposure-intro'],
    ph: 'PHOTO: CLIENT — Neha after a Recovery session, portrait'
  }];
  const by = arr => Object.fromEntries(arr.map(x => [x.id, x]));
  const EX = by(EXERCISES),
    PR = by(PRODUCTS),
    AR = by(ARTICLES),
    EV = by(EVENTS);
  const rel = {
    productsForExercise: id => (EX[id]?.equip || []).map(p => PR[p]).filter(Boolean),
    exercisesForProduct: pid => EXERCISES.filter(e => e.equip.includes(pid)),
    articlesForExercise: id => (EX[id]?.articles || []).map(a => AR[a]).filter(Boolean),
    eventsForSystem: sys => EVENTS.filter(e => e.system === sys),
    eventForExercise: id => (EX[id]?.events || []).map(e => EV[e]).filter(Boolean)[0],
    exercisesForArea: area => EXERCISES.filter(e => e.areas.includes(area)),
    relatedExercises: id => {
      const e = EX[id];
      return EXERCISES.filter(x => x.id !== id && (x.primary === e.primary || x.areas.some(a => e.areas.includes(a)))).slice(0, 3);
    },
    practiceTools: () => {
      const m = {};
      ASSESSMENT.plan.forEach(p => (EX[p.ex].equip || []).forEach(pid => {
        m[pid] = m[pid] || [];
        m[pid].push(EX[p.ex].name);
      }));
      return Object.entries(m).map(([pid, names]) => ({
        product: PR[pid],
        names
      }));
    }
  };
  const STAGES = ['success', 'intake', 'format', 'schedule', 'prepare', 'today', 'complete', 'analysis', 'ready', 'active'];
  const KEY = 'aditus-proto-stage';
  const stage = {
    get: () => {
      try {
        return localStorage.getItem(KEY) || 'success';
      } catch (e) {
        return 'success';
      }
    },
    set: s => {
      try {
        localStorage.setItem(KEY, s);
      } catch (e) {}
    },
    index: s => STAGES.indexOf(s),
    hasPractice: () => STAGES.indexOf(stage.get()) >= STAGES.indexOf('ready')
  };

  // ---------- render helpers ----------
  const h2 = (i, j, s) => {
    const n = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const vn = (x, y, s) => {
    const xi = Math.floor(x),
      yi = Math.floor(y),
      xf = x - xi,
      yf = y - yi;
    const u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf);
    const a = h2(xi, yi, s),
      b = h2(xi + 1, yi, s),
      c = h2(xi, yi + 1, s),
      d = h2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, s) => .5 * vn(x, y, s) + .3 * vn(x * 2.1, y * 2.1, s + 1) + .2 * vn(x * 4.3, y * 4.3, s + 2);
  const sm = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // ~17 s breath: inhale 7, hold 1.5, exhale 7, hold 1.5
  const breath = t => {
    const c = (t % 17 + 17) % 17;
    if (c < 7) return sm(0, 7, c);
    if (c < 8.5) return 1;
    if (c < 15.5) return 1 - sm(8.5, 15.5, c);
    return 0;
  };
  const rng = seed => {
    let s = seed * 9301 + 49297;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  };
  function prep(cv, dprMax) {
    const w = cv.clientWidth,
      h = cv.clientHeight;
    if (!w || !h) return null;
    const dpr = Math.min(dprMax || 2, window.devicePixelRatio || 1);
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv._drawn = 1;
    cv._key = key(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      ctx,
      w,
      h
    };
  }
  const key = cv => [cv.dataset.seed, cv.dataset.sys, cv.dataset.ht, cv.clientWidth, cv.clientHeight].join('|');

  // translucent tissue sheets — used by hero layers and lab art
  function sheet(ctx, w, h, r, o) {
    const ang = o.ang ?? (r() - .5) * 1.4,
      cx = w * (o.cx ?? .2 + r() * .6),
      cy = h * (o.cy ?? .2 + r() * .6),
      L = Math.max(w, h) * (o.L ?? 1.1 + r() * .6),
      W = Math.min(w, h) * (o.W ?? .3 + r() * .4);
    const ca = Math.cos(ang),
      sa = Math.sin(ang),
      wf = 1.2 + r() * 2,
      wa = W * (.25 + r() * .45),
      ph = r() * 6.28,
      tw = r() * 2 - 1;
    const pt = (u, v) => {
      const al = (u - .5) * L;
      const ac = v * W * (.55 + .45 * Math.sin(u * 3.1 + ph)) + wa * Math.sin(u * wf * 3.14 + ph) + tw * v * W * Math.sin(u * 5 + ph) * .55;
      return [cx + ca * al - sa * ac, cy + sa * al + ca * ac];
    };
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) {
      const [x, y] = pt(k / 48, -.5);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    for (let k = 48; k >= 0; k--) {
      const [x, y] = pt(k / 48, .5);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    const [a0, b0] = pt(.5, -.5),
      [a1, b1] = pt(.5, .5);
    const g = ctx.createLinearGradient(a0, b0, a1, b1);
    g.addColorStop(0, `rgba(${o.edge},${o.memA * .7})`);
    g.addColorStop(.45, `rgba(255,255,255,${o.memA * 1.6})`);
    g.addColorStop(.6, `rgba(${o.mid},${o.memA * .5})`);
    g.addColorStop(1, `rgba(${o.edge},${o.memA})`);
    ctx.fillStyle = g;
    ctx.fill();
    const N = o.fibres || 36;
    for (let i = 0; i <= N; i++) {
      const v = i / N - .5,
        hl = i % 6 === 0,
        blue = o.blue && i % 17 === 3;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const [x, y] = pt(k / 60, v + Math.sin(k * .5 + i) * .004);
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = blue ? `rgba(48,86,183,${o.fibA * .6})` : hl ? `rgba(255,255,255,${Math.min(1, o.fibA * 2.2)})` : `rgba(${o.fib},${o.fibA * (1 - Math.abs(v) * .8)})`;
      ctx.lineWidth = hl ? o.lw * 1.8 : o.lw;
      ctx.stroke();
    }
  }

  // Immersive living fascia: pre-rendered layers composited with GPU transforms (cheap per frame)
  function fasciaHero(host, opts) {
    opts = opts || {};
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const N = 5,
      layers = [];
    const front = opts.front;
    const build = () => {
      layers.forEach(l => l.cv.remove());
      layers.length = 0;
      const W = host.clientWidth,
        H = host.clientHeight;
      if (!W) return;
      for (let i = 0; i < N; i++) {
        const d = i / (N - 1),
          cv = document.createElement('canvas'),
          isFront = i === N - 1 && front;
        cv.style.cssText = 'position:absolute;left:-20%;top:-20%;width:140%;height:140%;pointer-events:none;will-change:transform,opacity;transform-origin:50% 50%;';
        (isFront ? front : host).appendChild(cv);
        const w = W * 1.4,
          h = H * 1.4,
          dpr = Math.min(i >= 3 ? 1.5 : 1, window.devicePixelRatio || 1);
        cv.width = w * dpr;
        cv.height = h * dpr;
        const ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (i < 3) ctx.filter = `blur(${(3 - i) * 3}px)`;
        const r = rng(11 + i * 7);
        const n = i === 0 ? 2 : 3;
        for (let k = 0; k < n; k++) sheet(ctx, w, h, r, {
          cx: .25 + r() * .5,
          cy: .3 + r() * .45,
          L: 1.2 + r() * .5,
          W: .25 + r() * (.5 - d * .2),
          memA: .05 + d * .07,
          fibA: .12 + d * .22,
          lw: .6 + d * .5,
          fibres: 30 + Math.floor(d * 24),
          edge: '170,180,198',
          mid: '214,224,238',
          fib: '128,138,158',
          blue: i >= 2
        });
        layers.push({
          cv,
          d,
          isFront
        });
      }
    };
    build();
    const mouse = {
      x: .5,
      y: .5,
      tx: .5,
      ty: .5,
      last: 0
    };
    const onM = e => {
      const r = host.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
      mouse.last = performance.now();
    };
    window.addEventListener('pointermove', onM, {
      passive: true
    });
    let vis = true;
    const io = new IntersectionObserver(es => es.forEach(e => vis = e.isIntersecting));
    io.observe(host);
    let rt;
    const onR = () => {
      clearTimeout(rt);
      rt = setTimeout(build, 200);
    };
    window.addEventListener('resize', onR);
    const t0 = performance.now();
    let raf,
      lastF = 0;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (!vis || now - lastF < 30) return;
      lastF = now;
      const t = reduced ? 3 : (now - t0) / 1000,
        br = breath(t),
        p = Math.min(1, Math.max(0, opts.progress ? opts.progress() : 0));
      if (now - mouse.last > 2500) {
        mouse.tx += (.5 - mouse.tx) * .01;
        mouse.ty += (.5 - mouse.ty) * .01;
      }
      mouse.x += (mouse.tx - mouse.x) * .04;
      mouse.y += (mouse.ty - mouse.y) * .04;
      const tension = Math.sin(Math.PI * Math.min(1, p * 1.5)),
        release = sm(.6, 1, p);
      const W = host.clientWidth,
        H = host.clientHeight;
      for (const l of layers) {
        const d = l.d,
          b = 1 + (.03 + .025 * d) * (br - .5);
        const sx = b * (1 + .55 * p * d) * (1 + .07 * tension - .04 * release),
          sy = b * (1 + .55 * p * d) * (1 - .09 * tension + .05 * release);
        const tx = (mouse.x - .5) * W * .035 * (d + .2) - (d - .5) * W * .05 * p,
          ty = (mouse.y - .5) * H * .03 * (d + .2) - p * H * (.08 + .5 * d);
        const sk = (mouse.x - .5) * 2.2 * d * (1 + tension),
          rot = (d - .5) * p * 7 + Math.sin(t * .05 + d * 3) * .6;
        l.cv.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) skewX(${sk.toFixed(2)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
        l.cv.style.opacity = (l.isFront ? .55 * (1 - sm(.15, .7, p)) : 1 - sm(.75, 1, p) * (.4 + .6 * d)).toFixed(3);
      }
    };
    raf = requestAnimationFrame(frame);
    return {
      t0,
      breath: () => breath((performance.now() - t0) / 1000),
      destroy() {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('pointermove', onM);
        window.removeEventListener('resize', onR);
        layers.forEach(l => l.cv.remove());
      }
    };
  }

  // editorial practice art (soft macro photo feel) — placeholder until real photography
  const PAL = {
    movement: ['#D9C8B4', '#8C6E57', '#F3E9DD', '204,170,140'],
    breathwork: ['#C9D6E2', '#5E7489', '#EEF3F7', '170,195,215'],
    recovery: ['#CBBEC6', '#5D4D57', '#EFE8EC', '190,170,185'],
    recovery: ['#E2C29B', '#3B4A5C', '#F6EBDD', '226,170,110']
  };
  function drawSoft(cv) {
    const p = prep(cv, 1.5);
    if (!p) return;
    const {
      ctx,
      w,
      h
    } = p;
    const pal = PAL[cv.dataset.sys] || PAL.movement;
    const r = rng(+cv.dataset.seed || 1);
    const g = ctx.createLinearGradient(0, 0, w * .4, h);
    g.addColorStop(0, pal[2]);
    g.addColorStop(.55, pal[0]);
    g.addColorStop(1, pal[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.filter = 'blur(18px)';
    for (let i = 0; i < 4; i++) {
      const x = r() * w,
        y = r() * h,
        rad = Math.max(w, h) * (.2 + r() * .35);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, i % 2 ? 'rgba(255,255,255,.55)' : `rgba(${pal[3]},.5)`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.filter = 'blur(1.2px)';
    for (let k = 0; k < 2; k++) sheet(ctx, w, h, r, {
      memA: .08,
      fibA: .22,
      lw: .7,
      fibres: 26,
      edge: pal[3],
      mid: '255,255,255',
      fib: '255,255,255'
    });
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = .15 + r() * .35;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 2 + r() * 9, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(20,18,22,.18)';
    ctx.fillRect(0, 0, w, h);
    const vg = ctx.createLinearGradient(0, h * .25, 0, h);
    vg.addColorStop(0, 'rgba(16,14,18,0)');
    vg.addColorStop(1, 'rgba(16,14,18,.62)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
  function drawLab(cv) {
    const p = prep(cv);
    if (!p) return;
    const {
      ctx,
      w,
      h
    } = p;
    const r = rng(+cv.dataset.seed || 1);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#F7F8FA');
    bg.addColorStop(1, '#E3E8F0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) sheet(ctx, w, h, r, {
      memA: .1,
      fibA: .3,
      lw: .7,
      fibres: 30,
      edge: '170,180,198',
      mid: '214,224,238',
      fib: '128,138,158',
      blue: true
    });
  }
  function drawHt(cv) {
    const p = prep(cv);
    if (!p) return;
    const {
      ctx,
      w,
      h
    } = p;
    const kind = cv.dataset.ht,
      seed = +cv.dataset.seed || 1;
    ctx.fillStyle = cv.dataset.bg || '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    const cell = 4,
      sc = 1 / 150,
      path = new Path2D(),
      solid = new Path2D();
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      const nx = x * sc,
        ny = y * sc,
        wx = nx + .7 * vn(nx * .7 + seed, ny * .7, seed + 5),
        wy = ny + .7 * vn(nx * .7, ny * .7 + seed, seed + 9);
      let v = kind === 'fibre' ? fbm(wx * .45, wy * 2.6, seed) : kind === 'rings' ? (() => {
        const dx = x / w - .5,
          dy = (y / h - .5) * h / w,
          rr = Math.sqrt(dx * dx + dy * dy);
        return .5 * fbm(wx, wy, seed) + .5 * (.5 + .5 * Math.cos(rr * 46 - fbm(wx, wy, seed + 3) * 3));
      })() : kind === 'flow' ? fbm(wx + wy * .9, wy * 1.1 - wx * .3, seed) : fbm(wx, wy, seed);
      if (v < .5) continue;
      const k = Math.min(1, (v - .5) / .2);
      if (k > .8) solid.rect(x, y, cell, cell);else {
        const s = cell * (.3 + .55 * k);
        path.rect(x + (cell - s) / 2, y + (cell - s) / 2, s, s);
      }
    }
    ctx.fillStyle = cv.dataset.fg || '#3056B7';
    ctx.fill(path);
    ctx.fill(solid);
  }
  const drawAny = cv => cv.dataset.soft !== undefined ? drawSoft(cv) : cv.dataset.lab !== undefined ? drawLab(cv) : drawHt(cv);
  function mountCanvases(root) {
    const sel = 'canvas[data-soft],canvas[data-lab],canvas[data-ht]',
      seen = new WeakSet();
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        drawAny(e.target);
        io.unobserve(e.target);
      }
    }), {
      rootMargin: '300px'
    });
    const scan = () => root.querySelectorAll(sel).forEach(cv => {
      if (!seen.has(cv)) {
        seen.add(cv);
        io.observe(cv);
      } else if (cv._drawn && cv._key !== key(cv)) drawAny(cv);
    });
    const bs = setTimeout(() => root.querySelectorAll(sel).forEach(cv => {
      if (!cv._drawn) drawAny(cv);
    }), 2500);
    let rt;
    const onR = () => {
      clearTimeout(rt);
      rt = setTimeout(() => root.querySelectorAll(sel).forEach(cv => cv._drawn && drawAny(cv)), 200);
    };
    window.addEventListener('resize', onR);
    scan();
    return {
      scan,
      destroy() {
        io.disconnect();
        clearTimeout(bs);
        window.removeEventListener('resize', onR);
      }
    };
  }
  // legacy dot field (kept for older pages)
  function field(cv, cfg) {
    const f = {
      cv,
      cfg,
      size() {
        const w = cv.clientWidth,
          h = cv.clientHeight;
        cv.width = w;
        cv.height = h;
        f.ctx = cv.getContext('2d');
        f.w = w;
        f.h = h;
      }
    };
    f.draw = () => {};
    f.size();
    return f;
  }
  function animateFields() {
    return {
      destroy() {},
      redraw() {}
    };
  }
  window.ADITUS = {
    OUTCOME,
    STORIES,
    ST: by(STORIES),
    fmt,
    SYSTEMS,
    SYS_ORDER,
    AREAS,
    EXERCISES,
    PRODUCTS,
    ARTICLES,
    EVENTS,
    PRACTITIONERS,
    TRAINING,
    ASSESSMENT,
    EX,
    PR,
    AR,
    EV,
    rel,
    STAGES,
    stage,
    breath,
    sm,
    drawLab,
    drawHt,
    drawSoft,
    fasciaHero,
    mountCanvases,
    field,
    animateFields
  };
  window.ADITUS_READY = cb => {
    if (window.ADITUS) return cb();
    const iv = setInterval(() => {
      if (window.ADITUS) {
        clearInterval(iv);
        cb();
      }
    }, 30);
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/data/aditus-shared.js", error: String((e && e.message) || e) }); }

// assets/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever a design needs an image.
 * You control the slot's shape; it sizes to its container by default. When the search_stock_photos tool
 * is available, prefill the slot by default — write the photo's URL into
 * src (with credit/credit-href); the user can still fill or replace it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The sidecar is a SIBLING of the HTML file that uses this component: the
 * read is a document-relative fetch, and the host resolves the bridge's
 * sidecar writes into the previewed file's directory to match (same
 * contract as design_canvas.jsx). Pages in the same directory share one
 * sidecar; keep slot ids distinct across them.
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          Initial framing baseline: cover | contain.   (default 'cover')
 *                cover starts the image filling the frame (overflow cropped);
 *                contain starts it fully visible (letterboxed). Either way the
 *                user can always pan/scale from there — double-click, or the
 *                Edit control, enters reframe mode (drag to move, scroll or
 *                corner-handles to scale; Escape / click-out commits). The
 *                crop persists alongside the image in the sidecar.
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. Prefill it with a real
 *                photo via search_stock_photos when that tool is available
 *                (set credit/credit-href from the result). A user drop
 *                overrides it; clearing the drop reveals src again.
 *   credit       Attribution text shown as a small overlay at the
 *                bottom-left of the filled slot. REQUIRED whenever src
 *                points at any Unsplash host (images.unsplash.com,
 *                plus.unsplash.com, …): an Unsplash src with no credit
 *                renders an error tile INSTEAD of the photo (Unsplash
 *                terms forbid showing their photos unattributed). Use the
 *                exact form 'Photo by {photographer name} on Unsplash' —
 *                the overlay then links the name to credit-href and
 *                'Unsplash' to the Unsplash homepage, and links back to
 *                unsplash.com automatically get the required utm referral
 *                params appended at render time. The credit belongs to
 *                the src image, so it only shows while src is what's
 *                displayed — a user-dropped image hides it.
 *   credit-href  Link for the photographer's name in the credit overlay
 *                (their Unsplash profile URL from the stock-photo search
 *                results). http(s) URLs only — anything else renders the
 *                name as plain text.
 *
 * Sizing: the slot fills its container by default (width/height 100%).
 * Put it in a sized wrapper — absolutely positioned, a grid cell, a fixed
 * frame — and it takes exactly that box. When the parent's height is
 * indefinite (ordinary flow), it falls back to full width at a 3:2 aspect
 * ratio instead of collapsing. In a shrink-to-fit parent (a float,
 * width:max-content, an unsized absolute wrapper), percentages have
 * nothing to resolve against — size the slot or its wrapper explicitly
 * there. For a fixed-size slot, set
 * width/height on the element itself (inline style), which overrides the
 * default. When
 * layering content above a slot (full-bleed layouts), make the overlay
 * click-through — pointer-events: none on scrims/text plates, re-enabled
 * on interactive children — so the slot's hover controls stay reachable.
 * Keep the slot's bottom-left corner visually clear as well: the credit
 * overlay renders there, and a dark fade or text plate covering it hides
 * the attribution Unsplash's terms require — end the fade above that
 * corner, or keep it nearly transparent where the credit sits.
 *
 * Usage:
 *   <div style="position:relative;width:100%;height:100%">      <!-- full-bleed: -->
 *     <image-slot id="bg" shape="rect"></image-slot>            <!-- fills the wrapper -->
 *   </div>
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';

  // Unsplash terms require visible attribution wherever their photos
  // display, and every link back to unsplash.com must carry utm referral
  // params. Two render-time rules enforce that here:
  //  - an Unsplash-src slot with NO credit attribute renders an error
  //    tile INSTEAD of the photo (an uncredited Unsplash photo on screen
  //    is itself the terms violation, so it never renders bare);
  //  - rendered credit links pointing at unsplash.com get the referral
  //    params appended when absent (credit-href values live in page
  //    content that can't be edited after the fact).
  // Keep the utm_source value in sync with UTM_SOURCE in
  // platform/web-agent/unsplash.ts — this file is a project-local
  // artifact and cannot import it (equality is pinned by tests).
  const UNSPLASH_HOMEPAGE_HREF = 'https://unsplash.com/?utm_source=claude_design&utm_medium=referral';
  // Host rule mirrors the hotlink validator that admits Unsplash srcs into
  // pages in the first place (cdn$ in unsplash.ts: apex or any subdomain)
  // — Unsplash+ results serve from plus.unsplash.com, not just images.*,
  // and an admitted-but-uncredited photo must error whatever unsplash
  // host it rides on.
  // Trailing-dot FQDNs (images.unsplash.com.) are the same host to the
  // browser but would miss the regex — strip one dot so the check fails
  // CLOSED (unrecognized-but-real Unsplash srcs must error, not render).
  const isUnsplashHost = u => {
    try {
      return /(^|\.)unsplash\.com$/.test(new URL(u, document.baseURI).hostname.replace(/\.$/, ''));
    } catch {
      return false;
    }
  };
  // Render-time referral normalization for links back to Unsplash:
  // appends utm_source/utm_medium when absent, preserves every existing
  // query param, never overwrites an existing utm_source, and passes
  // non-Unsplash URLs through untouched. Input is an ABSOLUTE validated
  // http(s) URL (the credit render funnel resolves + validates first).
  const withReferral = href => {
    try {
      const u = new URL(href);
      if (!/(^|\.)unsplash\.com$/.test(u.hostname.replace(/\.$/, ''))) {
        return href;
      }
      if (!u.searchParams.has('utm_source')) {
        u.searchParams.set('utm_source', 'claude_design');
      }
      if (!u.searchParams.has('utm_medium')) {
        u.searchParams.set('utm_medium', 'referral');
      }
      return u.toString();
    } catch (e) {
      return href;
    }
  };
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  // Unload-time flush: save()'s serialization defers a mid-RTT re-fire to a
  // .then that never runs in an unloading document, silently dropping a
  // pagehide commit. Post the current slots immediately instead — content
  // is a superset snapshot of any in-flight save's, the write is a
  // whole-file last-writer-wins replace, and postMessage FIFO delivers it
  // to the host after the in-flight one, so a backend-side reorder at
  // worst reproduces the dropped-commit outcome this flush improves on.
  // Guarded on the initial sidecar read: pre-hydration slots can miss
  // other slots' persisted entries, and flushing it would clobber them —
  // that narrow case stays best-effort (the in-memory merge in load()
  // cannot happen in an unloading document anyway).
  function flushNow() {
    if (!loaded) return;
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    try {
      Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {});
    } catch (e) {}
  }
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet =
  // Fill the container by default: slots are usually placed inside a
  // sized wrapper (a hero frame, a grid cell, an inset:0 layer) and are
  // expected to take that box — a fixed intrinsic size would render as
  // a small tile in the corner of a full-bleed wrapper instead.
  // aspect-ratio is the companion fallback that keeps a bare slot
  // visible when the parent's height is indefinite: height:100%
  // resolves to auto there, and the ratio then derives height from
  // width instead of letting the slot collapse to zero height.
  // Explicit width/height on the element override all of this.
  // color:inherit (not a fixed near-black): the placeholder chrome —
  // empty-state icon/caption (currentColor) and the dashed ring — must
  // read on dark decks too, and the slide's own text color is the one
  // color guaranteed to contrast with the slide background. The soft
  // look comes from opacity on those parts, not from a baked-in alpha.
  ':host{display:block;position:relative;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;' + '  width:100%;height:100%;aspect-ratio:3/2}' + '.empty .cap,.empty .sub{opacity:.75}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(127,127,127,.08)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  // popover=manual promotes the spill to the top layer on reframe, so it is
  // not clipped by any overflow:hidden / clip-path / scroll-container
  // ancestor (a plain z-index can't escape overflow clipping). UA popover
  // defaults (inset:0;margin:auto) are reset; _applyView sets viewport px.
  '.spill{position:fixed;margin:0;inset:auto;border:0;padding:0;background:transparent;' + '  overflow:visible;transform:translate(-50%,-50%);z-index:1;cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px}' + '.empty:hover .sub{opacity:1}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed currentColor;' + '  opacity:.35;transition:border-color .12s,opacity .12s}' + ':host([data-over]) .ring{border-color:#c96442;opacity:1}' + ':host([data-filled]) .ring{display:none}' +
  // Controls overlay INSIDE the frame, pinned to the top-right corner, so
  // a full-bleed slot in an overflow:hidden container still shows them
  // (the old below-mask placement got clipped). Credit sits bottom-left,
  // so top-right avoids collision. The blurred pill background keeps them
  // legible over the image.
  // The UA [popover] base rule styles the element in EVERY state (only
  // display:none is gated on :not(:popover-open), and the display:flex
  // below overrides that) — so the UA resets live HERE, like .spill's,
  // or the ordinary hover-state strip renders as a bordered Canvas box
  // centered by margin:auto. inset:auto precedes top/right (shorthand).
  '.ctl{position:absolute;inset:auto;top:8px;right:8px;margin:0;border:0;padding:0;' + '  background:transparent;overflow:visible;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' +
  // While reframing, the spill owns the top layer and would swallow every
  // click on the in-frame controls. Promoting .ctl into the top layer
  // ABOVE the spill (shown after it — later popovers stack higher) keeps
  // Edit-as-toggle and Replace clickable mid-reframe. _applyView pins it
  // to the frame's top-right in viewport px (translateX(-100%)
  // right-aligns against the computed left edge); inset:auto clears the
  // base rule's top/right so the inline left/top position it alone.
  '.ctl:popover-open{position:fixed;inset:auto;transform:translateX(-100%)}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}' +
  // Replacement in flight: after a src swap the browser keeps painting
  // the PREVIOUS image until the new one decodes, so a Replace would
  // flash the old photo and then pop. Hide the stale frame (visibility,
  // not display — _applyView geometry still applies) and spin until the
  // new image reports in (load/error clears data-swapping).
  ':host([data-swapping]) .frame img{visibility:hidden}' + '.loading{position:absolute;inset:0;display:none;align-items:center;' + '  justify-content:center;pointer-events:none}' + ':host([data-swapping]) .loading{display:flex}' + '.loading::after{content:"";width:22px;height:22px;border-radius:50%;' + '  border:2px solid rgba(127,127,127,.25);border-top-color:currentColor;' + '  animation:om-slot-spin .7s linear infinite}' + '@keyframes om-slot-spin{to{transform:rotate(360deg)}}' +
  // Reduced motion: the static two-tone ring still reads as "working".
  '@media (prefers-reduced-motion:reduce){.loading::after{animation:none}}' + '.credit{position:absolute;left:6px;bottom:6px;max-width:calc(100% - 12px);display:none;' + '  padding:3px 7px;border-radius:5px;background:rgba(0,0,0,.55);color:#fff;' + '  font:10px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;' + '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(6px)}' +
  // The credit is a SPAN holding one or two <a>s (Unsplash's prescribed
  // form links the photographer AND Unsplash) — anchors style inline so
  // the overlay reads as one line of text.
  '.credit a{color:inherit;text-decoration:none}' + '.credit a:hover,.credit a:focus-visible{text-decoration:underline}' + ':host([data-filled][data-credit]) .credit{display:block}' +
  // Exports must ship JUST the image — no hover controls, no credit chip
  // (the host marks <html data-om-exporting> for the capture window; the
  // page-level hide script can't reach shadow DOM, this rule can).
  ':host-context([data-om-exporting]) .ctl,' + ':host-context([data-om-exporting]) .credit{display:none !important}' +
  // Print must ship just the image too: the hover-gated controls can be
  // mid-hover when print() fires, and the credit chip is screen chrome —
  // the same rule the capture window gets, keyed on print media instead
  // of the host's data-om-exporting mark (the print path sets no mark).
  '@media print{.ctl,.credit{display:none !important}}' +
  // No export-window mask rules here on purpose: the export capture
  // releases the replacement mask by REMOVING data-swapping (the
  // shadow-root pass in pages/export/shared.ts HIDE_EXPORT_CHROME_SCRIPT)
  // — attribute removal works in every engine (:host-context is
  // Chromium-only), is scoped by construction to slots actually
  // mid-swap, and hides the spinner through the same gate. A masked img
  // would otherwise be silently dropped from PPTX decks (the capture
  // walk skips visibility:hidden imgs).
  // Attribution error tile: REPLACES the photo when an Unsplash src has
  // no credit attribute — rendering the photo uncredited is the terms
  // violation, so the photo must not appear at all.
  // Calm and neutral on purpose (review feedback): the tile informs the
  // user; the fix instructions are machine-facing (usage docblock, tool
  // description, and the turn-end scan's bounce copy name the attributes
  // for the agent).
  '.attr-error{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  background:#f2f1ef;color:#6e6c66;user-select:none;' + '  font:13px/1.45 system-ui,-apple-system,sans-serif}' + '.attr-error svg{opacity:.55}' + '.attr-error .cap{max-width:92%;font-weight:500;letter-spacing:.01em}' + ':host([data-attribution-error]) .attr-error{display:flex}' + ':host([data-attribution-error]) .ring{display:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  const warnIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>' + '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'placeholder', 'src', 'id', 'credit', 'credit-href'];
    }

    /** Duplicate-slide hook (called by deck-stage, see its
     *  _remintDuplicateIds): copy this id's stored image, if any, under a
     *  freshly minted key and return that key — so a duplicated slide's
     *  slot keeps its dropped photo instead of reverting to the
     *  placeholder. 'isFree' is the caller's uniqueness check (document
     *  ids); candidates must ALSO be unused in the sidecar, which can
     *  hold keys from other pages sharing the project root. (An EMPTY
     *  slot on another page leaves no sidecar entry, so its id is not
     *  detectable here — a minted key can collide with it and that slot
     *  would show this photo. Same blast radius as two pages reusing an
     *  id by hand, which the shared sidecar already permits.) Returns null
     *  when no id could be minted (caller strips the id, today's
     *  behavior). */
    static cloneSlot(fromId, isFree) {
      if (typeof fromId !== 'string' || !fromId) return null;
      // Pre-hydration the store can't veto candidates or source the copy
      // — degrade to the strip (today's behavior) rather than mint
      // against keys we can't see yet. Any rendered (= droppable) slot
      // means load() has already settled.
      if (!loaded) return null;
      const stem = fromId.replace(/-\d+$/, '') || fromId;
      for (let n = 2; n < 100; n++) {
        const toId = stem + '-' + n;
        if (toId === fromId) continue;
        if (slots[toId] !== undefined) {
          // Reuse a key holding this exact value (bytes AND crop) if no
          // live element here owns it — a duplicate op the host refused
          // after minting leaves such a key behind, and reusing keeps
          // refused retries from accumulating one orphaned copy per
          // attempt. Full equality (not just bytes) so a byte-identical
          // key another PAGE owns with its own crop is stepped past, not
          // adopted or rewritten. (Entries without .u never match.)
          const prev = getSlot(toId);
          const cur = getSlot(fromId);
          if (!(prev && cur && prev.u && prev.u === cur.u && prev.s === cur.s && prev.x === cur.x && prev.y === cur.y && (typeof isFree !== 'function' || isFree(toId)))) continue;
          return toId;
        }
        if (typeof isFree === 'function' && !isFree(toId)) continue;
        const v = getSlot(fromId);
        if (v) setSlot(toId, Object.assign({}, v));
        return toId;
      }
      return null;
    }
    constructor() {
      super();
      // clonable: rail thumbnails deep-clone slides and carry this shadow
      // along; reuse an already-cloned root so upgrade-after-clone works.
      // (Deliberately NOT serializable — a getHTML consumer would embed
      // multi-MB sidecar data-URLs into serialized page HTML.)
      const root = this.shadowRoot || this.attachShadow({
        mode: 'open',
        clonable: true
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="attr-error" part="attribution-error">' + warnIcon + '    <div class="cap">This photo needs attribution</div></div>' + '  <div class="loading" part="loading"></div>' + '  <div class="ring" part="ring"></div>' + '</div>' +
      // Outside .frame, like .spill/.ctl — the frame's overflow:hidden +
      // border-radius/clip-path would cut the credit off on circle/pill/mask.
      // A SPAN, not an <a>: the prescribed Unsplash credit holds two links
      // (photographer + Unsplash), built per-render in _render().
      '<span class="credit" part="credit"></span>' + '<div class="spill" popover="manual" data-dc-edit-transparent>' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' +
      // data-dc-edit-transparent: the DC editor's edit-mode picker lets
      // clicks through for chrome marked with it (EDIT_TRANSPARENT_SEL)
      // — without it, Replace/Edit clicks in Edit mode are swallowed by
      // element selection and the controls look dead.
      '<div class="ctl" popover="manual" data-dc-edit-transparent><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="edit" title="Reframe image">Edit</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ctl = root.querySelector('.ctl');
      this._credit = root.querySelector('.credit');
      this._attrError = root.querySelector('.attr-error');
      // Credit clicks open the link, not browse/reframe.
      this._credit.addEventListener('click', e => e.stopPropagation());
      this._credit.addEventListener('dblclick', e => e.stopPropagation());
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      // Encode-in-flight marker (the owning _ingest generation): while set,
      // the same-src "nothing in flight" clear in _render must not fire —
      // the stored value still points at the OLD image until the encode
      // lands, so that clear would unmask the stale image mid-replace.
      this._swapGen = 0;
      // Render-owned swap in flight: set when _render assigns a new src,
      // cleared only by the img's own load/error (or the empty branch).
      // img.complete CANNOT stand in for this — setting src only QUEUES
      // the current-request swap (a microtask), so synchronously after an
      // assignment, complete still reports the OLD settled request. The
      // pick path does exactly that: the host sets src, credit, and
      // credit-href back-to-back in one task, and renders #2/#3 would
      // read the stale complete === true and drop the mask one render
      // after it was set.
      this._loadPending = false;
      // See _render's empty branch: a transient attribution-error wipe of a
      // showing image must make the follow-up render a replacement (spinner),
      // not a first fill (blank frame).
      this._hidShowing = false;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act) return;
        // The hidden controls are opacity-0 but still tabbable — without
        // this gate a keyboard user could drive them on a read-only share
        // link (mirrors the dblclick handler's editable gate).
        if (!this.hasAttribute('data-editable')) return;
        if (act === 'replace') {
          this._exitReframe(true);
          // Host-owned picker (Unsplash modal; it also offers local import).
          this.dispatchEvent(new CustomEvent('image-slot:pick', {
            bubbles: true,
            composed: true,
            detail: {
              id: this.id || null
            }
          }));
        }
        if (act === 'edit') {
          if (!this._reframes()) return;
          if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      // load/error also release the replacement-in-flight mask (via the
      // single discipline in _releaseMask): the swap is only revealed once
      // the new image can actually paint (on error the frame shows its
      // background, same as a fresh slot with a broken src).
      this._img.addEventListener('load', () => {
        this._loadPending = false;
        this._releaseMask(true);
        this._applyView();
      });
      this._img.addEventListener('error', () => {
        this._loadPending = false;
        this._releaseMask(true);
      });
      // Gated only on editable — any filled slot can be repositioned/scaled,
      // regardless of fit. Share links (no writeFile) stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
          const base = contain ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // The host may inject window.omelette.writeFile AFTER the first render;
      // re-render on hover so the editable-gated controls reliably appear.
      this.addEventListener('pointerenter', this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('pointerenter', this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      // commit=false: a disconnect is not a user intent — committing here
      // would persist whatever half-finished drag a React remount or DOM
      // splice happened to interrupt. Deliberate exits commit on their own
      // paths (Escape/click-out/toggle), and unloads commit via pagehide.
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._signalReframe(true);
      // Best-effort commit when the document unloads mid-reframe (a host
      // navigation racing the enter signal, a manual reload, tab close):
      // the sidecar write rides the host bridge, which outlives this
      // document, so the crop survives even though the mode dies with the
      // DOM. Held on the instance so _exitReframe detaches exactly what
      // was attached.
      this._pagehide = () => {
        this._exitReframe(true);
        flushNow();
      };
      window.addEventListener('pagehide', this._pagehide);
      // Promote spill to the top layer, then keep it pinned over the frame:
      // scroll/resize cover the common cases, and a per-frame rect check
      // catches layout shifts that fire neither (an image above finishing
      // load, streamed DOM pushing the slot down, an ancestor transform
      // change) so the overlay can't detach from the frame.
      try {
        this._spill.showPopover();
      } catch {}
      // After the spill, so the controls stack above it in the top layer.
      try {
        this._ctl.showPopover();
      } catch {}
      this._reposition = () => {
        if (this.hasAttribute('data-reframe')) this._applyView();
      };
      window.addEventListener('scroll', this._reposition, true);
      window.addEventListener('resize', this._reposition);
      this._lastRect = '';
      this._watch = () => {
        if (!this.hasAttribute('data-reframe')) return;
        const r = this.getBoundingClientRect();
        const key = r.left + ',' + r.top + ',' + r.width + ',' + r.height;
        if (key !== this._lastRect) {
          this._lastRect = key;
          this._applyView();
        }
        this._watchId = requestAnimationFrame(this._watch);
      };
      this._watchId = requestAnimationFrame(this._watch);
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (this._reposition) {
        window.removeEventListener('scroll', this._reposition, true);
        window.removeEventListener('resize', this._reposition);
        this._reposition = null;
      }
      if (this._watchId) {
        cancelAnimationFrame(this._watchId);
        this._watchId = 0;
      }
      if (this._pagehide) {
        window.removeEventListener('pagehide', this._pagehide);
        this._pagehide = null;
      }
      try {
        this._spill.hidePopover();
      } catch {}
      try {
        this._ctl.hidePopover();
      } catch {}
      this._ctl.style.left = '';
      this._ctl.style.top = '';
      if (commit) this._commitView();
      this._signalReframe(false);
    }

    // Reframe state lives only in this DOM until commit, invisible to the
    // host's dirty signals — announce enter/exit so the host can hold
    // auto-reloads for exactly the gesture (the guest bundle forwards
    // image-slot:reframe to the host as imageSlotReframe). Dispatched on
    // the element (composed, so it escapes shadow roots) while connected;
    // a disconnected exit (disconnectedCallback) falls back to document so
    // the host still hears it.
    _signalReframe(active) {
      const target = this.isConnected ? this : document;
      target.dispatchEvent(new CustomEvent('image-slot:reframe', {
        bubbles: true,
        composed: true,
        detail: {
          active: active,
          id: this.id || null
        }
      }));
    }

    // Public: host's "Import from computer" calls this to run local browse.
    openFilePicker() {
      this._exitReframe(true);
      this._input.click();
    }

    // A src write is a newer intent for this slot's content — the host
    // pick path (setImageSlotImage) or an agent edit — so it must win
    // over any encode still in flight from an earlier drop: left live,
    // that encode lands later, passes _ingest's gen guard, and its
    // setSlot silently overwrites the pick (the stored value shadows
    // src in _render). Bumping _gen kills the encode before its own
    // _swapGen clear runs, so clear the dead claim here too — otherwise
    // _releaseMask (gated on !_swapGen) never fires and the pick's
    // spinner is stranded. src ONLY: the pick sets credit/credit-href
    // in the same task, and clearing _swapGen on those would let the
    // same-src branch unmask the old image mid-encode.
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'src' && oldVal !== newVal) {
        this._gen++;
        this._swapGen = 0;
      }
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      // Replacing a shown image: surface the swap through the encode too,
      // not just the decode — otherwise the old photo sits there with no
      // feedback while the canvas re-encode runs. An empty slot keeps its
      // placeholder (no spinner) until the encode lands, as before.
      // _swapGen guards the mask against re-renders DURING the encode
      // (pointerenter, ResizeObserver, another slot's store write): the
      // stored value still resolves to the old image there, so _render's
      // same-src clear would otherwise unmask it mid-replace.
      if (this.hasAttribute('data-filled')) {
        this.setAttribute('data-swapping', '');
        this._swapGen = gen;
      }
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        // Clear BEFORE setSlot: its synchronous re-render must see no
        // pending encode, so a byte-identical re-upload (same data URL, no
        // load event coming) still clears the mask via the complete branch.
        this._swapGen = 0;
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._swapGen = 0;
        // Reveal the kept old image — unless another replacement (a
        // remote pick's src swap) is still in flight, in which case the
        // mask stays until THAT image settles (its load/error releases).
        this._releaseMask();
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is available on any filled slot — the user can
    // always reposition/scale. `fit` only sets the initial baseline (see
    // _geom): contain starts fully-visible, cover starts frame-filling.
    _reframes() {
      return this.hasAttribute('data-filled');
    }

    // The single release discipline for the replacement-in-flight mask
    // (data-swapping). The mask comes off only when BOTH hold:
    //  - no encode is pending (_swapGen) — mid-encode the stored value
    //    still resolves to the old image, so any reveal paints it;
    //  - the frame img has settled on its current src — an unsettled src
    //    means some replacement is still in flight (e.g. a remote pick),
    //    whoever started it, and revealing would paint the previous
    //    frame. The load/error listeners pass settled=true (the event IS
    //    the settlement signal, per spec complete is true by then);
    //    other callers rely on the complete flag (covers loaded AND
    //    failed).
    // Every release path funnels through here EXCEPT _render's empty
    // branch (the img is being cleared — nothing will ever settle).
    _releaseMask(settled) {
      if (!this._swapGen && !this._loadPending && (settled || this._img.complete)) {
        this.removeAttribute('data-swapping');
      }
    }

    // Baseline geometry, shared by clamp/apply/resize. `base` is the scale at
    // view-scale s=1: cover = fill the frame (overflow on the looser axis),
    // contain = fit fully inside (letterboxed). Zooming a contain image past
    // s where it overflows naturally becomes a crop. Null until the img has
    // loaded (naturalWidth is 0 before that) or when the slot has no layout
    // box — ResizeObserver fires with a 0×0 rect under display:none, and
    // clamping against a degenerate 1×1 frame would silently pull the stored
    // pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
      const base = contain ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
      return {
        iw,
        ih,
        fw,
        fh,
        base
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      // Top-layer controls: pin to the frame's top-right in viewport px
      // (the same 8px inset as the in-frame layout; unscaled — top-layer UI
      // reads as chrome, not page content). BEFORE the geometry branch:
      // placement needs only the frame rect, and a not-yet-loaded or broken
      // src must not leave the promoted strip floating unpositioned. Gated
      // on the popover actually being open: without the Popover API,
      // showPopover() threw (swallowed in _enterReframe), .ctl stays in
      // its in-frame absolute layout, and viewport-px coordinates would
      // shove it off-frame — and matches(':popover-open') itself throws
      // there (unknown pseudo-class), hence the try/catch.
      if (this.hasAttribute('data-reframe')) {
        let onTop = false;
        try {
          onTop = this._ctl.matches(':popover-open');
        } catch {}
        if (onTop) {
          const r = this.getBoundingClientRect();
          this._ctl.style.left = r.right - 8 + 'px';
          this._ctl.style.top = r.top + 8 + 'px';
        }
      }
      if (!g) {
        // Dimensions not known yet (before img load) — centered fit so there
        // is no flash of an unpositioned image before the geometry lands.
        const contain = (this.getAttribute('fit') || 'cover').toLowerCase() === 'contain';
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = contain ? 'contain' : 'cover';
        return;
      }
      // Baseline (cover-fill or contain-fit) × view scale. Width/height and
      // left/top are all frame-% — depends only on the frame aspect ratio, so
      // a responsive resize keeps the same crop. The spill layer mirrors the
      // same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      if (this.hasAttribute('data-reframe')) {
        // Top-layer spill: position in viewport px over the frame. The top
        // layer escapes ancestor transforms entirely, so EVERY term must be
        // in viewport units: getBoundingClientRect gives the frame's scaled
        // origin AND size, and the rect/layout ratio rescales the ghost —
        // sizing from layout px alone renders it 1/scale too large under a
        // scaled deck slide. Inner ghost + handles stay box-relative.
        const r = this.getBoundingClientRect();
        const sx = g.fw ? r.width / g.fw : 1;
        const sy = g.fh ? r.height / g.fh : 1;
        this._spill.style.width = g.iw * k * sx + 'px';
        this._spill.style.height = g.ih * k * sy + 'px';
        this._spill.style.left = r.left + (50 + this._view.x) / 100 * r.width + 'px';
        this._spill.style.top = r.top + (50 + this._view.y) / 100 * r.height + 'px';
      }
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      // An Unsplash src with no credit attribute must NOT render — showing
      // the photo uncredited is the Unsplash-terms violation itself. The
      // error tile replaces the photo until the credit is written. A
      // user-dropped image is the user's own content and always renders.
      // Trimmed: credit is agent/user-editable content, and a whitespace-
      // only value must count as missing — otherwise it would suppress the
      // error tile AND render an empty credit box (no text, no links),
      // exactly the unattributed state this gate exists to prevent.
      const credit = (this.getAttribute('credit') || '').trim();
      const attrError = !!(!credit && !this._userUrl && srcAttr && isUnsplashHost(srcAttr));
      this.toggleAttribute('data-attribution-error', attrError);
      if (url && !attrError) {
        const prev = this._img.getAttribute('src');
        if (prev !== url) {
          // Replacing an already-shown image: mark the swap BEFORE setting
          // src so the stale frame is never revealed (see the data-swapping
          // stylesheet rules). First fill (prev empty) keeps the existing
          // placeholder-until-load behavior — no spinner. _hidShowing
          // covers the pick path's transient attribution-error wipe: prev
          // is gone, but an image WAS showing, so this is a replacement.
          if (prev || this._hidShowing) this.setAttribute('data-swapping', '');
          // Mark the swap BEFORE assigning src: complete keeps reporting
          // the old settled request until the browser's
          // update-the-image-data microtask runs, so same-task re-renders
          // (the pick path's credit/credit-href setAttributes) need this
          // flag, not complete, to know a load is in flight.
          this._loadPending = true;
          this._img.src = url;
          this._ghost.src = url;
        } else {
          // Same-src re-render — release if settled, so an ingest-set
          // spinner can't stick after a byte-identical re-upload (same
          // data URL, no further load event ever fires).
          this._releaseMask();
        }
        this._hidShowing = false;
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this.removeAttribute('data-swapping');
        // The src is being removed — no load/error will ever fire for it.
        this._loadPending = false;
        // A transient attribution-error wipe of a showing image happens on
        // the pick path: the host sets src one setAttribute before credit,
        // so render N hides the old image (attrError) and render N+1
        // restores a URL. Remember the wipe so that restore renders as a
        // replacement (spinner), not a first fill (blank frame).
        this._hidShowing = attrError && !!this._img.getAttribute('src');
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        // The error tile owns the blocked-photo state; .empty stays for
        // the genuinely-empty slot.
        this._empty.style.display = attrError ? 'none' : 'flex';
        this.removeAttribute('data-filled');
      }

      // Credit belongs to the author src, so a user drop hides it.
      // textContent + the http(s)-only funnel keep external strings inert.
      const showCredit = !!(url && credit && !this._userUrl && !attrError);
      this._credit.textContent = '';
      if (showCredit) {
        // Validate once (resolved against the document, http(s) only),
        // then append the terms-required utm referral params to links
        // that point back at unsplash.com.
        let href = '';
        const rawHref = this.getAttribute('credit-href') || '';
        if (rawHref) {
          try {
            const u = new URL(rawHref, document.baseURI);
            if (u.protocol === 'http:' || u.protocol === 'https:') {
              href = withReferral(u.href);
            }
          } catch {}
        }
        const mkLink = (text, linkHref) => {
          const a = document.createElement('a');
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          a.setAttribute('href', linkHref);
          a.textContent = text;
          return a;
        };
        // Unsplash's prescribed credit is TWO links — the photographer's
        // name to their profile (credit-href) and 'Unsplash' to the
        // homepage. Render that split whenever the text has the canonical
        // shape; other text keeps the legacy single-link rendering.
        const m = /^Photo by (.+) on Unsplash$/.exec(credit);
        if (m) {
          this._credit.appendChild(document.createTextNode('Photo by '));
          this._credit.appendChild(href ? mkLink(m[1], href) : document.createTextNode(m[1]));
          this._credit.appendChild(document.createTextNode(' on '));
          this._credit.appendChild(mkLink('Unsplash', UNSPLASH_HOMEPAGE_HREF));
        } else if (href) {
          this._credit.appendChild(mkLink(credit, href));
        } else {
          this._credit.textContent = credit;
        }
      }
      this.toggleAttribute('data-credit', showCredit);
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/image-slot.js", error: String((e && e.message) || e) }); }

// components/brand/AditusMark.jsx
try { (() => {
const LOOPS = [{
  id: 'movement',
  name: 'Movement',
  cx: 628,
  cy: 382,
  r: 218,
  rot: -8
}, {
  id: 'breathwork',
  name: 'Breath',
  cx: 880,
  cy: 636,
  r: 218,
  rot: 20
}, {
  id: 'recovery',
  name: 'Recovery',
  cx: 622,
  cy: 878,
  r: 218,
  rot: 6
}, {
  id: 'performance',
  name: 'Performance',
  cx: 380,
  cy: 622,
  r: 218,
  rot: -24
}];
const pts = l => Array.from({
  length: 7
}, (_, i) => {
  const a = (l.rot + i * 360 / 7 - 90) * Math.PI / 180;
  return (l.cx + l.r * Math.cos(a)).toFixed(1) + ',' + (l.cy + l.r * Math.sin(a)).toFixed(1);
}).join(' ');
function AditusMark({
  active = '',
  color = '#006DE0',
  muted = '#BDEBFF',
  size = 120,
  onPick,
  style
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "80 80 1094 1094",
    role: "img",
    "aria-label": 'ADITUS' + (active ? ' — ' + active : ''),
    style: {
      width: size,
      height: size,
      display: 'block',
      overflow: 'visible',
      ...style
    }
  }, LOOPS.map(l => {
    const on = active === l.id,
      dim = active && !on;
    return /*#__PURE__*/React.createElement("g", {
      key: l.id,
      onClick: () => onPick && onPick(on ? '' : l.id),
      style: {
        cursor: onPick ? 'pointer' : 'default',
        opacity: dim ? .55 : 1,
        transform: on ? 'scale(1.045)' : 'scale(1)',
        transformBox: 'fill-box',
        transformOrigin: 'center',
        transition: 'opacity 1.1s ease,transform 1.1s cubic-bezier(.2,.7,.1,1)'
      }
    }, /*#__PURE__*/React.createElement("polygon", {
      points: pts(l),
      fill: "none",
      stroke: dim ? muted : color,
      strokeWidth: "104",
      strokeLinejoin: "round",
      style: {
        transition: 'stroke 1.1s ease'
      }
    }));
  }));
}
Object.assign(__ds_scope, { AditusMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/AditusMark.jsx", error: String((e && e.message) || e) }); }

// components/cards/EventCard.jsx
try { (() => {
function EventCard({
  date,
  time,
  title,
  place,
  req,
  href
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      padding: '18px clamp(16px,2vw,24px) 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      background: h ? 'var(--ice)' : '#FFFFFF',
      color: 'var(--ink)',
      textDecoration: 'none',
      transition: 'background-color .2s'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: 'flex-start',
      padding: '3px 8px',
      background: 'var(--ink)',
      color: '#FFFFFF',
      fontFamily: 'var(--font-mono)',
      fontSize: 11
    }
  }, date, time && ' · ' + time), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 21,
      lineHeight: 1
    }
  }, String(title).toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--grey-700)'
    }
  }, place, req && ' · ' + req));
}
Object.assign(__ds_scope, { EventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/EventCard.jsx", error: String((e && e.message) || e) }); }

// components/content/ImageSlot.jsx
try { (() => {
function ImageSlot({
  caption = 'PHOTO',
  src,
  tone = 'light',
  ratio,
  style
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      height: ratio ? undefined : '100%',
      aspectRatio: ratio,
      background: src ? '#000' : dark ? 'rgba(255,255,255,.06)' : 'var(--grey-50)',
      overflow: 'hidden',
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      textAlign: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: dark ? 'rgba(255,255,255,.6)' : 'var(--grey-600)',
      backgroundImage: dark ? 'none' : 'repeating-linear-gradient(135deg,transparent 0 14px,rgba(16,24,40,.035) 14px 15px)'
    }
  }, caption));
}
Object.assign(__ds_scope, { ImageSlot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ImageSlot.jsx", error: String((e && e.message) || e) }); }

// components/cards/ProductCard.jsx
try { (() => {
function ProductCard({
  name,
  brand = 'ADITUS',
  type,
  price,
  tag,
  href,
  caption,
  actionLabel = 'ADD +',
  onAction
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("article", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'block',
      aspectRatio: '1/1',
      position: 'relative',
      background: 'var(--grey-50)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ImageSlot, {
    caption: caption || 'PHOTO: PRODUCT — ' + name + ', object on white'
  }), tag && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 10,
      top: 10,
      padding: '2px 7px',
      background: 'var(--sky)',
      fontFamily: 'var(--font-mono)',
      fontSize: 10
    }
  }, tag)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--grey-600)'
    }
  }, brand), /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: '-.01em',
      color: 'inherit',
      textDecoration: 'none'
    }
  }, name), type && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, type), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, price), /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      height: 32,
      padding: '0 10px',
      border: '1.5px solid var(--ink)',
      background: h ? 'var(--ink)' : '#FFFFFF',
      color: h ? '#FFFFFF' : 'var(--ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      cursor: 'pointer'
    }
  }, actionLabel))));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionHeader.jsx
try { (() => {
function SectionHeader({
  title,
  kicker,
  intro,
  link,
  href,
  size = 'lg',
  tone = 'ink',
  style
}) {
  const fs = size === 'xl' ? 'clamp(44px,8vw,128px)' : size === 'md' ? 'clamp(32px,3.6vw,52px)' : 'clamp(44px,6vw,100px)';
  const lines = String(title).split('\n');
  const light = tone === 'light';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(18px,2vw,28px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 20,
      flexWrap: 'wrap',
      color: light ? '#FFFFFF' : 'var(--ink)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, kicker && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: light ? 'var(--ice)' : 'var(--blue)'
    }
  }, kicker), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: fs,
      lineHeight: .86
    }
  }, lines.map((l, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("br", null), l))), intro && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(17px,1.4vw,20px)',
      maxWidth: '44ch',
      color: light ? 'var(--grey-300)' : 'var(--grey-700)'
    }
  }, intro)), link && /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      textDecoration: 'underline',
      textUnderlineOffset: 5,
      color: 'inherit'
    }
  }, link));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/content/SpecList.jsx
try { (() => {
function SpecList({
  items = []
}) {
  return /*#__PURE__*/React.createElement("dl", {
    style: {
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      borderTop: '2px solid var(--ink)',
      fontFamily: 'var(--font-sans)'
    }
  }, items.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'grid',
      gridTemplateColumns: '140px minmax(0,1fr)',
      gap: 16,
      padding: '12px 0',
      borderBottom: '1px solid var(--grey-200)',
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      color: 'var(--grey-600)'
    }
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0
    }
  }, v))));
}
Object.assign(__ds_scope, { SpecList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SpecList.jsx", error: String((e && e.message) || e) }); }

// components/content/StepList.jsx
try { (() => {
function StepList({
  steps = []
}) {
  return /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column'
    }
  }, steps.map((t, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '36px 1fr',
      padding: '12px 0',
      borderTop: '1px solid var(--grey-200)',
      fontFamily: 'var(--font-mono)',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, String(i + 1).padStart(2, '0')), t)));
}
Object.assign(__ds_scope, { StepList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/StepList.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const V = {
  ink: {
    bg: 'var(--ink)',
    fg: '#FFFFFF',
    bd: '0',
    hover: {
      transform: 'translate(-3px,-3px)',
      boxShadow: '6px 6px 0 #006DE0'
    }
  },
  blue: {
    bg: 'var(--blue)',
    fg: '#FFFFFF',
    bd: '0',
    hover: {
      background: 'var(--navy)'
    }
  },
  outline: {
    bg: 'transparent',
    fg: 'var(--ink)',
    bd: '2px solid var(--ink)',
    hover: {
      background: 'var(--ice)'
    }
  },
  white: {
    bg: '#FFFFFF',
    fg: 'var(--ink)',
    bd: '0',
    hover: {
      background: 'var(--ice)'
    }
  },
  'outline-light': {
    bg: 'transparent',
    fg: '#FFFFFF',
    bd: '2px solid #FFFFFF',
    hover: {
      background: 'var(--navy)'
    }
  }
};
const S = {
  sm: [40, 14, 12],
  md: [50, 20, 13],
  lg: [58, 26, 15],
  xl: [60, 34, 17]
};
function Button({
  variant = 'ink',
  size = 'lg',
  href,
  children,
  onClick,
  disabled,
  full,
  style
}) {
  const [h, setH] = React.useState(false);
  const v = V[variant] || V.ink,
    [ht, px, fs] = S[size] || S.lg;
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      height: ht,
      padding: '0 ' + px + 'px',
      background: v.bg,
      color: v.fg,
      border: v.bd,
      display: full ? 'flex' : 'inline-flex',
      width: full ? '100%' : undefined,
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: fs,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .4 : 1,
      transition: 'transform .2s,box-shadow .2s,background-color .2s',
      ...(h && !disabled ? v.hover : null),
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Label.jsx
try { (() => {
const T = {
  blue: ['var(--blue)', '#FFFFFF'],
  ink: ['var(--ink)', '#FFFFFF'],
  sky: ['var(--sky)', 'var(--ink)'],
  ice: ['var(--ice)', 'var(--ink)'],
  navy: ['var(--navy)', '#FFFFFF'],
  periwinkle: ['var(--periwinkle)', 'var(--ink)']
};
function Label({
  children,
  tone = 'blue',
  display = false,
  style
}) {
  const [bg, fg] = T[tone] || T.blue;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignSelf: 'flex-start',
      padding: display ? '4px 10px' : '3px 8px',
      background: bg,
      color: fg,
      fontFamily: display ? 'var(--font-display)' : 'var(--font-mono)',
      fontSize: display ? 12 : 11,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Label });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Label.jsx", error: String((e && e.message) || e) }); }

// components/cards/CategoryCard.jsx
try { (() => {
function CategoryCard({
  title,
  line,
  count,
  tone = 'sky',
  href,
  caption,
  ratio = '4/3'
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--ink)',
      textDecoration: 'none',
      background: '#FFFFFF'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: ratio
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ImageSlot, {
    caption: caption || 'PHOTO: PRODUCT — ' + title
  }), count != null && /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: tone,
    style: {
      position: 'absolute',
      left: 12,
      top: 12
    }
  }, count, " TOOLS")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
      borderTop: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(20px,2vw,28px)',
      lineHeight: .95
    }
  }, String(title).toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--grey-700)'
    }
  }, line)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20
    }
  }, "\u2192")));
}
Object.assign(__ds_scope, { CategoryCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CategoryCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PracticeCard.jsx
try { (() => {
function PracticeCard({
  type = 'EXERCISE',
  tone = 'blue',
  title,
  meta1,
  meta2,
  href,
  caption,
  ratio = '4/5'
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--ink)',
      textDecoration: 'none',
      background: '#FFFFFF'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: ratio,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ImageSlot, {
    caption: caption || 'PHOTO: MOVEMENT'
  }), /*#__PURE__*/React.createElement(__ds_scope.Label, {
    tone: tone,
    display: true,
    style: {
      position: 'absolute',
      left: 12,
      top: 12,
      fontSize: 11,
      padding: '3px 9px'
    }
  }, type)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      borderTop: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(20px,1.8vw,26px)',
      lineHeight: 1
    }
  }, String(title).toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, meta1), meta2 && ' · ' + meta2)));
}
Object.assign(__ds_scope, { PracticeCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PracticeCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function Pill({
  children,
  href,
  active,
  onClick,
  style
}) {
  const [h, setH] = React.useState(false);
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      height: 30,
      padding: '0 12px',
      border: '1px solid var(--ink)',
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      background: active ? 'var(--ink)' : h ? 'var(--mist)' : 'transparent',
      color: active ? '#FFFFFF' : 'var(--ink)',
      textDecoration: 'none',
      cursor: 'pointer',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  children,
  tone = 'ink',
  size = 'md',
  style
}) {
  const c = tone === 'light' ? '#FFFFFF' : 'var(--ink)';
  const big = size === 'lg';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      height: big ? 38 : 26,
      padding: big ? '0 14px' : '0 9px',
      border: '1.5px solid ' + c,
      color: c,
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: big ? 'var(--font-sans)' : 'var(--font-mono)',
      fontSize: big ? 15 : 10,
      textTransform: big ? 'none' : 'uppercase',
      whiteSpace: 'nowrap',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/cards/PathCard.jsx
try { (() => {
function PathCard({
  name,
  line,
  tags = [],
  cta,
  href,
  caption,
  tone = 'white',
  minHeight = 'clamp(520px,80vh,820px)'
}) {
  const blue = tone === 'blue';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      minHeight,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ImageSlot, {
    caption: caption || 'PHOTO: TRAINING'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      margin: 'clamp(12px,2vw,24px)',
      padding: 'clamp(18px,2.4vw,30px)',
      background: blue ? 'var(--blue)' : '#FFFFFF',
      color: blue ? '#FFFFFF' : 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(32px,3.8vw,60px)',
      lineHeight: .86
    }
  }, String(name).toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17
    }
  }, line), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t,
    tone: blue ? 'light' : 'ink'
  }, t))), cta && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    href: href,
    size: "md",
    variant: blue ? 'white' : 'blue',
    style: {
      alignSelf: 'flex-start',
      marginTop: 4
    }
  }, cta, " \u2192")));
}
Object.assign(__ds_scope, { PathCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PathCard.jsx", error: String((e && e.message) || e) }); }

// components/core/TextLink.jsx
try { (() => {
function TextLink({
  children,
  href,
  display = false,
  tone = 'ink',
  style
}) {
  const [h, setH] = React.useState(false);
  const c = tone === 'light' ? '#FFFFFF' : tone === 'sky' ? 'var(--sky)' : h ? 'var(--blue)' : 'var(--ink)';
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      color: c,
      fontFamily: display ? 'var(--font-display)' : 'var(--font-mono)',
      fontSize: display ? 14 : 13,
      textDecoration: 'underline',
      textUnderlineOffset: display ? 6 : 5,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { TextLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TextLink.jsx", error: String((e && e.message) || e) }); }

// components/forms/EmailSignup.jsx
try { (() => {
function EmailSignup({
  tone = 'dark',
  cta = 'SIGN UP',
  done = "YOU'RE ON THE LIST.",
  onSubmit
}) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const fg = tone === 'dark' ? '#FFFFFF' : 'var(--ink)';
  if (sent) return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      color: tone === 'dark' ? 'var(--sky)' : 'var(--blue)'
    }
  }, done);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "email",
    placeholder: "you@email.com",
    value: email,
    onChange: e => setEmail(e.target.value),
    style: {
      flex: 1,
      minWidth: 0,
      height: 50,
      padding: '0 14px',
      border: '2px solid ' + fg,
      borderRight: 0,
      background: 'transparent',
      color: fg,
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      outlineColor: 'var(--sky)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (email.includes('@')) {
        setSent(true);
        onSubmit && onSubmit(email);
      }
    },
    style: {
      flex: 'none',
      height: 50,
      padding: '0 18px',
      border: 0,
      background: 'var(--blue)',
      color: '#FFFFFF',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      cursor: 'pointer'
    }
  }, cta));
}
Object.assign(__ds_scope, { EmailSignup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/EmailSignup.jsx", error: String((e && e.message) || e) }); }

// components/forms/OptionRow.jsx
try { (() => {
function OptionRow({
  label,
  desc,
  checked,
  multi = false,
  onClick
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    role: multi ? 'checkbox' : 'radio',
    "aria-checked": !!checked,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '28px minmax(0,1fr)',
      gap: 16,
      alignItems: 'start',
      textAlign: 'left',
      width: '100%',
      padding: '18px 16px',
      minHeight: 64,
      border: 0,
      borderBottom: '1px solid var(--grey-200)',
      background: checked ? 'var(--ice)' : h ? 'var(--mist)' : '#FFFFFF',
      boxShadow: checked ? 'inset 4px 0 0 var(--blue)' : 'none',
      cursor: 'pointer',
      transition: 'background-color .15s'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      marginTop: 2,
      border: '2px solid var(--ink)',
      borderRadius: multi ? 0 : '50%',
      background: checked ? 'var(--blue)' : '#FFFFFF',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13
    }
  }, checked ? '✓' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.01em',
      color: 'var(--ink)'
    }
  }, label), desc && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, desc)));
}
Object.assign(__ds_scope, { OptionRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/OptionRow.jsx", error: String((e && e.message) || e) }); }

// components/forms/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value = 0,
  color = 'var(--sky)'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: 'var(--mist)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      width: Math.max(0, Math.min(1, value)) * 100 + '%',
      background: color,
      transition: 'width .3s ease'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/VariantSelector.jsx
try { (() => {
function VariantSelector({
  label = 'Variant',
  options = [],
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      textTransform: 'uppercase'
    }
  }, label, " \u2014 ", value), /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))',
      gap: 8
    }
  }, options.map(o => {
    const on = o === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o,
      role: "radio",
      "aria-checked": on,
      onClick: () => onChange && onChange(o),
      style: {
        height: 48,
        border: '2px solid var(--ink)',
        background: on ? 'var(--ink)' : '#FFFFFF',
        color: on ? '#FFFFFF' : 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer'
      }
    }, o);
  })));
}
Object.assign(__ds_scope, { VariantSelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/VariantSelector.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CategoryBar.jsx
try { (() => {
function CategoryBar({
  items = [],
  value,
  onChange,
  cartCount = 0,
  onCart
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,.97)',
      borderBottom: '1px solid var(--grey-200)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px clamp(20px,4vw,64px)',
      fontFamily: 'var(--font-mono)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, items.map(c => {
    const on = c === value;
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      onClick: () => onChange && onChange(c),
      style: {
        flex: 'none',
        height: 34,
        padding: '0 12px',
        border: '1px solid ' + (on ? 'var(--ink)' : 'var(--grey-200)'),
        background: on ? 'var(--ink)' : '#FFFFFF',
        color: on ? '#FFFFFF' : 'var(--ink)',
        fontSize: 11,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        cursor: 'pointer'
      }
    }, c);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onCart,
    style: {
      flex: 'none',
      height: 34,
      padding: '0 12px',
      border: 0,
      background: 'var(--blue)',
      color: '#FFFFFF',
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      cursor: 'pointer'
    }
  }, "CART ", cartCount));
}
Object.assign(__ds_scope, { CategoryBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CategoryBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteFooter.jsx
try { (() => {
const COLS = [['TRAINING', ['Personal Training', 'Group Training', 'Assessment', 'Find your starting point']], ['SHOP', ['All tools', 'Mobility & Fascia', 'Recovery', 'Shipping & returns']], ['PRACTICE', ['Exercises', 'Insights', 'Client Stories']], ['ADITUS', ['About', 'Community', 'Coaches', 'Account']]];
const PLACES = [['ADITUS MUMBAI · BANDRA', '14 Chapel Road, Bandra West, Mumbai 400050', 'Mon–Sat 6:30–21:00 · Sun 7:00–12:00'], ['ADITUS BENGALURU · INDIRANAGAR', '212 12th Main, Indiranagar, Bengaluru 560038', 'Mon–Sat 6:30–21:00']];
const SOC = ['Instagram', 'YouTube', 'Strava', 'LinkedIn', 'WhatsApp'];
const RULE = '1px solid rgba(255,255,255,.14)';
function SiteFooter({
  onNavigate
} = {}) {
  const pad = 'clamp(40px,5vw,72px) clamp(20px,4vw,64px)';
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--ink)',
      color: '#FFFFFF',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      lineHeight: 1.55
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
      borderBottom: RULE
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      borderRight: RULE
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.AditusMark, {
    color: "#FFFFFF",
    size: 56
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(32px,4vw,60px)',
      lineHeight: .88
    }
  }, "COME AND", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--sky)'
    }
  }, "TRAIN WITH US.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 440
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ice)'
    }
  }, "FIELD NOTES \u2014 ONE EMAIL A MONTH. NO HYPE."), /*#__PURE__*/React.createElement(__ds_scope.EmailSignup, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: pad,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))',
      gap: '28px 20px'
    }
  }, COLS.map(([t, ls]) => /*#__PURE__*/React.createElement("nav", {
    key: t,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      color: 'var(--sky)',
      marginBottom: 4
    }
  }, t), ls.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      color: 'var(--grey-300)',
      textDecoration: 'none'
    }
  }, l)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
      borderBottom: RULE
    }
  }, PLACES.map(([n, a, h]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      padding: '24px clamp(20px,4vw,64px)',
      borderRight: RULE,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--grey-300)'
    }
  }, a), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--grey-400)',
      fontSize: 12
    }
  }, h), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--sky)',
      fontSize: 12,
      textDecoration: 'underline',
      textUnderlineOffset: 4
    }
  }, "Directions \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px clamp(20px,4vw,64px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15
    }
  }, "CONTACT"), /*#__PURE__*/React.createElement("span", null, "hello@aditus.in"), /*#__PURE__*/React.createElement("span", null, "+91 22 4000 0000"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--grey-300)'
    }
  }, "WhatsApp us \u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--grey-400)',
      fontSize: 12
    }
  }, "Replies within one working day."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px clamp(20px,4vw,64px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, SOC.map(s => /*#__PURE__*/React.createElement("a", {
    key: s,
    href: "#",
    style: {
      height: 40,
      padding: '0 14px',
      border: '1.5px solid rgba(255,255,255,.4)',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      fontSize: 12,
      textDecoration: 'none'
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      flexWrap: 'wrap',
      fontSize: 11,
      color: 'var(--grey-400)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 ADITUS"), /*#__PURE__*/React.createElement("span", null, "Terms"), /*#__PURE__*/React.createElement("span", null, "Privacy"), /*#__PURE__*/React.createElement("span", null, "Shipping & returns"), /*#__PURE__*/React.createElement("a", {
    href: "#map",
    onClick: e => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate('map');
      }
    },
    style: {
      color: '#FFFFFF',
      textDecoration: 'none'
    }
  }, "Platform map \u2192"))));
}
Object.assign(__ds_scope, { SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteNav.jsx
try { (() => {
const GROUPS = [['training', 'TRAINING', ['Personal Training', 'Group Training', 'Assessment'], {
  bg: '#006DE0',
  fg: '#FFFFFF',
  kicker: 'TRAINING',
  title: 'ONE-TO-ONE OR TOGETHER.',
  link: 'Explore training →',
  ph: 'PHOTO: TRAINING'
}], ['shop', 'SHOP', ['Mobility & Fascia', 'Feet', 'Training', 'Recovery', 'Light & Vision', 'Sleep', 'Sets'], {
  bg: '#BDEBFF',
  fg: '#101828',
  kicker: 'SHOP · NEW',
  title: 'TOOLS WE ACTUALLY USE.',
  link: 'Shop all tools →',
  ph: 'PHOTO: PRODUCT'
}], ['library', 'LIBRARY', ['Exercises', 'Insights', 'Client Stories'], {
  bg: '#31B1EF',
  fg: '#101828',
  kicker: 'LIBRARY · THIS WEEK',
  title: '90/90 HIP ROTATION. 6 MIN.',
  link: 'Explore the library →',
  ph: 'PHOTO: MOVEMENT'
}], ['community', 'COMMUNITY', ['Events', 'Sessions', 'People'], {
  bg: '#1F3777',
  fg: '#FFFFFF',
  kicker: 'NEXT · SAT 17 OCT · 06:00',
  title: 'RUN & PLUNGE.',
  link: 'See what’s on →',
  ph: 'PHOTO: COMMUNITY'
}], ['about', 'ABOUT', ['Our philosophy', 'Method', 'Coaches'], {
  bg: '#FFFFFF',
  fg: '#101828',
  kicker: 'ABOUT',
  title: 'WHY WE TRAIN THE WAY WE DO.',
  link: 'How we think about training →',
  ph: 'ADITUS MARK'
}]];
function SiteNav({
  active = '',
  cta = 'START ASSESSMENT',
  cartCount,
  onNavigate,
  defaultOpen = false,
  overlay = 'fixed'
}) {
  const [open, setOpen] = React.useState(defaultOpen),
    [hover, setHover] = React.useState('training'),
    [exp, setExp] = React.useState('');
  const go = id => e => {
    if (onNavigate) {
      e.preventDefault();
      setOpen(false);
      onNavigate(id);
    }
  };
  const cur = GROUPS.find(g => g[0] === hover) || GROUPS[0];
  const btn = {
    height: 40,
    padding: '0 12px 0 10px',
    border: 0,
    background: open ? 'var(--ink)' : 'transparent',
    color: open ? '#FFFFFF' : 'var(--ink)',
    fontFamily: 'var(--font-display)',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer'
  };
  const bar = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    background: 'currentColor',
    transition: 'transform .25s'
  };
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'relative',
      height: 60,
      padding: '0 clamp(12px,2.4vw,32px)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 12,
      background: '#FFFFFF',
      borderBottom: '1px solid var(--grey-200)',
      fontFamily: 'var(--font-mono)',
      color: 'var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setOpen(!open);
      setExp('');
    },
    "aria-expanded": open,
    style: {
      ...btn,
      justifySelf: 'start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 18,
      height: 12,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...bar,
      top: 0,
      transform: open ? 'translateY(4.75px) rotate(45deg)' : 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...bar,
      bottom: 0,
      transform: open ? 'translateY(-4.75px) rotate(-45deg)' : 'none'
    }
  })), open ? 'CLOSE' : 'MENU'), /*#__PURE__*/React.createElement("a", {
    href: "#home",
    onClick: go('home'),
    "aria-label": "ADITUS home",
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 24,
      letterSpacing: '.02em',
      color: 'var(--ink)',
      textDecoration: 'none',
      lineHeight: 1
    }
  }, "ADITUS"), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: 'end',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      fontSize: 12,
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#account",
    onClick: go('account'),
    style: {
      color: 'inherit',
      textDecoration: 'none'
    }
  }, "Account"), /*#__PURE__*/React.createElement("a", {
    href: "#cart",
    onClick: go('cart'),
    style: {
      color: 'inherit',
      textDecoration: 'none'
    }
  }, "Cart", cartCount ? ' (' + cartCount + ')' : ''), /*#__PURE__*/React.createElement("a", {
    href: "#assessment",
    onClick: go('assessment'),
    style: {
      height: 40,
      padding: '0 14px',
      background: 'var(--blue)',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      textTransform: 'none',
      whiteSpace: 'nowrap',
      textDecoration: 'none'
    }
  }, cta)), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: overlay,
      top: 60,
      left: 0,
      right: 0,
      bottom: 0,
      height: overlay === 'absolute' ? 560 : undefined,
      zIndex: 80,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)',
      background: '#FFFFFF',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: 'clamp(20px,3vw,48px)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, GROUPS.map(([id, label, items]) => {
    const hot = hover === id || active === id,
      isOpen = exp === id;
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      style: {
        borderBottom: '1px solid var(--grey-200)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: '#' + id,
      onClick: go(id),
      onMouseEnter: () => setHover(id),
      style: {
        flex: 1,
        padding: 'clamp(6px,1vw,12px) 0',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(40px,6.2vw,92px)',
        lineHeight: .92,
        color: hot ? 'var(--blue)' : 'var(--ink)',
        textDecoration: 'none',
        transition: 'color .25s,padding .3s',
        paddingLeft: hover === id ? 10 : 0
      }
    }, label), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setExp(isOpen ? '' : id);
        setHover(id);
      },
      style: {
        flex: 'none',
        width: 44,
        height: 44,
        border: '2px solid var(--ink)',
        background: isOpen ? 'var(--ink)' : '#FFFFFF',
        color: isOpen ? '#FFFFFF' : 'var(--ink)',
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        cursor: 'pointer'
      }
    }, isOpen ? '−' : '+')), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '4px 0 18px'
      }
    }, items.map(i => /*#__PURE__*/React.createElement("a", {
      key: i,
      href: '#' + id,
      onClick: go(id),
      style: {
        height: 38,
        padding: '0 14px',
        border: '1.5px solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        color: 'var(--ink)',
        textDecoration: 'none'
      }
    }, i))));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      flexWrap: 'wrap',
      paddingTop: 20,
      fontSize: 12,
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Account"), /*#__PURE__*/React.createElement("span", null, "Find your starting point"), /*#__PURE__*/React.createElement("span", null, "Instagram"))), /*#__PURE__*/React.createElement("aside", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: cur[3].bg,
      color: cur[3].fg,
      transition: 'background-color .35s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 320,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 'clamp(16px,2vw,28px)',
      border: '1.5px dashed currentColor',
      opacity: .5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      letterSpacing: '.06em'
    }
  }, cur[3].ph)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(20px,2.4vw,36px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: '.06em'
    }
  }, cur[3].kicker), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,2.6vw,40px)',
      lineHeight: .92
    }
  }, cur[3].title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      textDecoration: 'underline',
      textUnderlineOffset: 4
    }
  }, cur[3].link)))));
}
Object.assign(__ds_scope, { SiteNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteNav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/About.jsx
try { (() => {
const ABOUT = {
  LOOK: {
    performance: 'Strength, endurance and work capacity — and the activities you want more of.',
    movement: 'How you squat, hinge, lunge, rotate, carry and walk — and where you work around a limit.',
    breathwork: 'Where your ribs expand, how you exhale, and how breathing holds up as effort rises.',
    recovery: 'Sleep, training load, and how quickly you come back down after hard work.'
  },
  IN: {
    performance: 'Progressive strength and conditioning, sport-specific where it matters.',
    movement: 'Strength and mobility built together, with range you can control and load.',
    breathwork: 'Coached during movement and effort — not as a separate meditation.',
    recovery: 'Load planning, sleep habits, active recovery, and cold or heat where they help.'
  },
  WHY: {
    performance: 'Capacity is what lets you say yes to the trek, the match, the climb.',
    movement: 'It’s what you use every day — and where most limits show up first.',
    breathwork: 'It sets trunk pressure and position, and it’s your quickest lever on effort and stress.',
    recovery: 'Training is the stimulus. Recovery is where you actually adapt to it.'
  },
  THEME: {
    performance: ['var(--blue)', '#fff', 'rgba(255,255,255,.25)'],
    movement: ['#fff', 'var(--ink)', 'var(--grey-200)'],
    breathwork: ['var(--ice)', 'var(--ink)', 'rgba(16,24,40,.15)'],
    recovery: ['var(--navy)', '#fff', 'rgba(255,255,255,.2)']
  },
  PH: {
    performance: 'PHOTO: PERFORMANCE — sprint or heavy lift, documentary',
    movement: 'PHOTO: MOVEMENT — loaded carry, close crop',
    breathwork: 'PHOTO: BREATH — ribcage under effort, side light',
    recovery: 'PHOTO: RECOVERY — sleep, sauna or cold plunge'
  }
};
function AboutScreen({
  go
}) {
  const {
    AditusMark,
    ImageSlot,
    Tag,
    Button
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [act, setAct] = React.useState('');
  const R = '2px solid var(--ink)';
  const H = {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    lineHeight: .86
  };
  const method = [['ASSESS', 'How you move, breathe, recover and perform — and what you want to do.'], ['PRIORITISE', 'The few things that need the most attention.'], ['TRAIN', 'Personal or Group — built around you, not a template.'], ['RECOVER', 'Sleep, load and recovery — where adaptation happens.'], ['REASSESS', 'See what changed. Re-prioritise. Keep going.']];
  const together = [['Movement + breath', 'Breathing sets the pressure and position you move and lift from.'], ['Breath + recovery', 'How you breathe shapes how quickly you come back down.'], ['Recovery + performance', 'Training gives the body a reason to adapt; recovery lets it.'], ['Performance + movement', 'Capacity is only useful if you can move well enough to use it.']];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 7',
      padding: 'clamp(48px,7vw,112px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "/ABOUT"), /*#__PURE__*/React.createElement("h1", {
    style: {
      ...H,
      fontSize: 'clamp(40px,5.6vw,100px)'
    }
  }, "PEAK HUMAN", /*#__PURE__*/React.createElement("br", null), "CAPABILITY", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, "IS TRAINABLE.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(19px,1.6vw,23px)',
      maxWidth: '34ch'
    }
  }, "Capability is what your body lets you do: move, carry, climb, run, play, recover and keep going. ADITUS builds this through movement, breath, recovery and performance. Together, they build sustainable longevity."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, A.SYS_ORDER.map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    onMouseEnter: () => setAct(k),
    onClick: () => setAct(k),
    style: {
      height: 46,
      padding: '0 16px',
      border: R,
      background: act === k ? 'var(--blue)' : '#fff',
      color: act === k ? '#fff' : 'var(--ink)',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      transition: 'background-color .4s,color .4s'
    }
  }, A.SYSTEMS[k].name.toUpperCase())))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 5',
      padding: 'clamp(32px,4vw,64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--blue)'
    }
  }, /*#__PURE__*/React.createElement(AditusMark, {
    size: "min(100%,460px)",
    color: "#FFFFFF",
    muted: "#31B1EF",
    active: act,
    onPick: setAct
  }))), A.SYS_ORDER.map((k, i) => {
    const x = A.SYSTEMS[k],
      [bg, fg, rule] = ABOUT.THEME[k];
    return /*#__PURE__*/React.createElement("section", {
      key: k,
      style: {
        borderBottom: R
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: i % 2 ? 'row-reverse' : 'row'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 480px',
        minWidth: 0,
        minHeight: 'clamp(380px,60vh,680px)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(ImageSlot, {
      caption: ABOUT.PH[k]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 16,
        top: 16,
        width: 64,
        height: 64,
        padding: 8,
        background: '#fff'
      }
    }, /*#__PURE__*/React.createElement(AditusMark, {
      size: 48,
      active: k
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 440px',
        minWidth: 0,
        padding: 'clamp(40px,5vw,80px) var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        background: bg,
        color: fg
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, "0", i + 1, " / 04"), /*#__PURE__*/React.createElement("h2", {
      style: {
        ...H,
        fontSize: 'clamp(44px,5.6vw,100px)',
        lineHeight: .84
      }
    }, x.name.toUpperCase()), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 'clamp(20px,1.7vw,24px)'
      }
    }, x.line)), /*#__PURE__*/React.createElement("dl", {
      style: {
        margin: 0,
        borderTop: '2px solid ' + fg
      }
    }, [['WHAT IT IS', x.what], ['WHY WE TRAIN IT', ABOUT.WHY[k]], ['WHAT WE LOOK AT', ABOUT.LOOK[k]], ['IN TRAINING', ABOUT.IN[k]]].map(([a, b]) => /*#__PURE__*/React.createElement("div", {
      key: a,
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(120px,170px) minmax(0,1fr)',
        gap: 14,
        padding: '13px 0',
        borderBottom: '1px solid ' + rule
      }
    }, /*#__PURE__*/React.createElement("dt", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 12
      }
    }, a), /*#__PURE__*/React.createElement("dd", {
      style: {
        margin: 0,
        fontSize: 14
      }
    }, b)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
      }
    }, x.topics.map(t => /*#__PURE__*/React.createElement("span", {
      key: t,
      style: {
        height: 28,
        padding: '0 10px',
        border: '1.5px solid ' + fg,
        display: 'flex',
        alignItems: 'center',
        fontSize: 11
      }
    }, t))), /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        go('library');
      },
      style: {
        alignSelf: 'flex-start',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        textDecoration: 'underline',
        textUnderlineOffset: 6,
        color: fg
      }
    }, x.name.toUpperCase(), " PRACTICES \u2192"))));
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R,
      padding: 'clamp(64px,9vw,140px) var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
      gap: 'clamp(32px,5vw,80px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "HOW THEY WORK TOGETHER"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(36px,4.4vw,68px)',
      lineHeight: .9
    }
  }, "TOGETHER: SUSTAINABLE", /*#__PURE__*/React.createElement("br", null), "LONGEVITY.")), /*#__PURE__*/React.createElement("div", null, together.map(([a, b]) => /*#__PURE__*/React.createElement("div", {
    key: a,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '18px 0',
      borderTop: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(18px,1.6vw,22px)'
    }
  }, a.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17,
      color: '#344054'
    }
  }, b))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '18px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 17,
      color: 'var(--grey-700)'
    }
  }, "Longevity isn\u2019t a fifth thing to train. Sustainable longevity is what you get when all four work together, for decades."))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R,
      background: 'var(--ink)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(20px,3vw,32px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(44px,5.6vw,92px)'
    }
  }, "THE METHOD"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ice)',
      maxWidth: 360
    }
  }, "Exercises are one part of this. The product is the system \u2014 and the capability it builds.")), /*#__PURE__*/React.createElement("ol", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(50%,180px),1fr))',
      borderTop: '1px solid rgba(255,255,255,.2)'
    }
  }, method.map(([t, d], i) => /*#__PURE__*/React.createElement("li", {
    key: t,
    style: {
      padding: '22px clamp(16px,2vw,24px) 30px',
      borderRight: '1px solid rgba(255,255,255,.2)',
      marginRight: -1,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minHeight: 210
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--sky)'
    }
  }, "0", i + 1, " ", i < 4 ? '→' : '↺'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(22px,2.2vw,30px)',
      lineHeight: 1
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-300)'
    }
  }, d))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R,
      background: 'var(--ice)',
      padding: 'clamp(64px,9vw,140px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(24px,3vw,40px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      maxWidth: 900
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "THE POINT"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(36px,4.6vw,76px)',
      lineHeight: .88
    }
  }, "A CAPABLE BODY GIVES", /*#__PURE__*/React.createElement("br", null), "YOU MORE OPTIONS."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,21px)',
      maxWidth: '44ch'
    }
  }, "The point isn\u2019t to train for ADITUS. It\u2019s to train so you can keep doing what matters to you:")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px 28px'
    }
  }, ['Play', 'Travel', 'Climb', 'Run', 'Work', 'Compete', 'Explore', 'Recover'].map(a => /*#__PURE__*/React.createElement("span", {
    key: a,
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,3.4vw,52px)',
      lineHeight: 1
    }
  }, a)))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R,
      padding: 'clamp(64px,9vw,140px) var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      gap: 'clamp(24px,4vw,64px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 5',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "WHAT WE BELIEVE"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(34px,4vw,64px)',
      lineHeight: .9
    }
  }, "MORE INDEPENDENT,", /*#__PURE__*/React.createElement("br", null), "NOT MORE DEPENDENT.")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 7',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,22px)',
      lineHeight: 1.5,
      maxWidth: '58ch'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "We don\u2019t want you relying on a coach, a device, a recovery tool or a fixed programme forever."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "We want you to understand your body well enough to keep moving, training and doing what you enjoy \u2014 with or without us."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--grey-700)'
    }
  }, "Products are tools. Training is a means. The outcome is physical independence."))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(20px,3vw,32px)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(44px,5.6vw,92px)'
    }
  }, "COACHES")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
      borderTop: R
    }
  }, A.PRACTITIONERS.map(c => /*#__PURE__*/React.createElement("figure", {
    key: c.id,
    style: {
      margin: 0,
      marginRight: -2,
      borderRight: R,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '4/5'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PHOTO: COACH \u2014 portrait at work"
  })), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      padding: '16px 18px 22px',
      borderTop: '4px solid var(--blue)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22
    }
  }, c.name.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--blue)'
    }
  }, c.role.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 16
    }
  }, c.bio)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(64px,8vw,120px) var(--gutter)',
      background: 'var(--blue)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(44px,6vw,100px)'
    }
  }, "FIND OUT WHERE", /*#__PURE__*/React.createElement("br", null), "YOU\u2019RE STARTING", /*#__PURE__*/React.createElement("br", null), "FROM."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "white",
    style: {
      height: 56,
      fontSize: 14
    },
    onClick: () => go('assessment')
  }, "START ASSESSMENT"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    style: {
      height: 56,
      fontSize: 14
    },
    onClick: () => go('group')
  }, "GROUP TRAINING"))));
}
window.AboutScreen = AboutScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/About.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Account.jsx
try { (() => {
function AccountScreen({
  go
}) {
  const {
    ImageSlot
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [st, setSt] = React.useState('success');
  const [hand, setHand] = React.useState(false);
  const mono = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--grey-600)'
  };
  const H = fs => ({
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: fs,
    lineHeight: .9
  });
  const ink = (label, onClick, extra) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      alignSelf: 'flex-start',
      height: 56,
      padding: '0 24px',
      border: 0,
      background: 'var(--ink)',
      color: '#fff',
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      ...extra
    }
  }, label);
  const proto = (label, to) => /*#__PURE__*/React.createElement("button", {
    onClick: () => setSt(to),
    style: {
      alignSelf: 'flex-start',
      padding: '10px 14px',
      border: '1px dashed var(--grey-400)',
      background: '#fff',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--grey-700)'
    }
  }, "PROTOTYPE \xB7 ", label);
  if (st === 'success') return /*#__PURE__*/React.createElement("main", {
    style: {
      fontFamily: 'var(--font-sans)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      minHeight: 'calc(100vh - 60px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(48px,7vw,104px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      borderRight: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: 'flex-start',
      padding: '5px 10px',
      background: 'var(--ink)',
      color: '#fff',
      fontFamily: 'var(--font-mono)',
      fontSize: 12
    }
  }, "ORDER #ADT-10482 \xB7 PAID"), /*#__PURE__*/React.createElement("h1", {
    style: H('clamp(44px,6vw,92px)')
  }, "YOU'RE IN."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'clamp(20px,1.8vw,26px)',
      marginTop: -12
    }
  }, "ADITUS Assessment confirmed."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      padding: '18px 0',
      borderTop: '2px solid var(--ink)',
      borderBottom: 'var(--rule)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-600)'
    }
  }, "Assessment purchased"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.015em'
    }
  }, "Full Body Assessment"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--grey-700)'
    }
  }, "Flexible format \u2014 in-centre or remote")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 500
    }
  }, "\u20B9XX,XXX")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      background: 'var(--mist)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "Your ADITUS account is ready."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: '#344054'
    }
  }, "We created it with ", /*#__PURE__*/React.createElement("b", null, "aarav.shah@gmail.com"), " from checkout. A sign-in link is in your inbox \u2014 no password needed.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: mono
  }, "NEXT ACTION"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: '-.02em'
    }
  }, "Complete your assessment intake"), ink('CONTINUE →', () => setSt('analysis'), {
    height: 58
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(48px,7vw,104px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      background: '#F7F9FC'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: mono
  }, "WHAT HAPPENS NEXT"), [['01', 'Intake', 'About 8 minutes — for your practitioner.'], ['02', 'Format', 'In-centre or remote.'], ['03', 'Schedule', 'Pick a date and time.'], ['04', 'Prepare', 'What to wear and bring.']].map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: 'grid',
      gridTemplateColumns: '44px minmax(0,1fr)',
      gap: 12,
      padding: '16px 0',
      borderTop: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: 'var(--blue)',
      paddingTop: 3
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--grey-700)'
    }
  }, d))))));
  const active = st === 'active';
  const nav = [['Overview', true, active ? 'Practice' : st === 'ready' ? 'Ready' : 'Review'], ['Assessment', false, st !== 'analysis' ? 'Ready' : ''], ['Practice', false, active ? '4' : 'After handover'], ['Orders', false, ''], ['Settings', false, '']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      fontFamily: 'var(--font-sans)',
      minHeight: 'calc(100vh - 60px)'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      flex: '1 1 220px',
      maxWidth: '100%',
      borderRight: 'var(--rule)',
      padding: '24px clamp(16px,2vw,24px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 11,
      padding: '0 10px 10px'
    }
  }, "/ACCOUNT"), nav.map(([l, on, m]) => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      padding: 10,
      fontSize: 15,
      background: on ? 'var(--mist)' : 'transparent',
      color: on ? 'var(--ink)' : '#344054',
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12
    }
  }, l, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      fontSize: 11
    }
  }, m)))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: '999 1 560px',
      minWidth: 0,
      padding: 'clamp(28px,4vw,56px) var(--gutter) 120px',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(28px,3vw,40px)'
    }
  }, st === 'analysis' && /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: 'var(--blue)'
    }
  }, "STATUS \xB7 ANALYSIS IN PROGRESS"), /*#__PURE__*/React.createElement("h1", {
    style: H('clamp(36px,4.6vw,68px)')
  }, "YOUR", /*#__PURE__*/React.createElement("br", null), "PRACTITIONER", /*#__PURE__*/React.createElement("br", null), "IS REVIEWING."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 19,
      lineHeight: 1.45
    }
  }, "Your assessment is complete. Meera is reviewing what she saw and preparing your priorities and recommended practice. A person writes this, not an algorithm \u2014 so it takes a few days."), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--ink)'
    }
  }, [['Assessment completed', '22 OCT ✓', '#166534'], ['Practitioner review', 'IN PROGRESS', 'var(--blue)'], ['Priorities & practice written', 'NEXT', 'var(--grey-600)'], ['Results published', 'EXPECTED 27 OCT', 'var(--grey-600)']].map(([t, s, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      padding: '14px 0',
      borderBottom: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: c
    }
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: 18,
      background: '#F7F9FC'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: mono
  }, "WHILE YOU WAIT"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('library', 'capability-is-trainable');
    },
    style: {
      fontSize: 17
    }
  }, "What we mean by capability \u2014 5 min read \u2192"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('library');
    },
    style: {
      fontSize: 17
    }
  }, "Browse the practice library \u2192")), proto('Practitioner publishes results', 'ready')), st === 'ready' && /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      minHeight: 220,
      border: '2px solid var(--ink)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PHOTO: MOVEMENT"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: 'clamp(20px,3vw,36px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: 'var(--navy)'
    }
  }, "STATUS \xB7 READY"), /*#__PURE__*/React.createElement("h1", {
    style: H('clamp(36px,4.6vw,68px)')
  }, "YOUR ASSESSMENT", /*#__PURE__*/React.createElement("br", null), "IS READY."), ink('VIEW YOUR ASSESSMENT →', () => setSt('active')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      border: 'var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: mono
  }, "HANDOVER"), hand ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: '-.015em'
    }
  }, "Wednesday 28 October \xB7 4:00 PM"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--grey-700)'
    }
  }, "30 minutes with Meera Rao \xB7 Video call"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      textDecoration: 'underline'
    }
  }, "Add to calendar")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: '-.015em'
    }
  }, "Talk it through with Meera"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--grey-700)'
    }
  }, "A 30-minute call to walk through your results and your first practice."), /*#__PURE__*/React.createElement("button", {
    onClick: () => setHand(true),
    style: {
      alignSelf: 'flex-start',
      height: 44,
      padding: '0 18px',
      border: '2px solid var(--ink)',
      background: '#fff',
      fontFamily: 'var(--font-display)',
      fontSize: 13
    }
  }, "BOOK HANDOVER"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      border: 'var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: mono
  }, "INSIDE"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, "Summary \xB7 3 priorities \xB7 Findings across movement, breath and recovery \xB7 Your first practice")))), active && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: 'var(--blue)'
    }
  }, "ASSESSMENT COMPLETE \xB7 22 OCT"), /*#__PURE__*/React.createElement("h1", {
    style: H('clamp(36px,4.6vw,72px)')
  }, "YOUR", /*#__PURE__*/React.createElement("br", null), "TRAINING PLAN"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
      border: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(20px,2.4vw,30px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'var(--ink)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: 'var(--ice)'
    }
  }, "NEXT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'clamp(24px,2.4vw,34px)',
      fontWeight: 500,
      letterSpacing: '-.02em',
      lineHeight: 1.1
    }
  }, "Book your first Personal Training block"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--grey-300)'
    }
  }, "8 sessions with Meera Rao \xB7 twice a week"), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('personal'),
    style: {
      alignSelf: 'flex-start',
      marginTop: 6,
      height: 52,
      padding: '0 22px',
      border: 0,
      background: '#fff',
      color: 'var(--ink)',
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, "BOOK SESSIONS \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(20px,2.4vw,30px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: mono
  }, "RECOMMENDED PATH"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(24px,2.4vw,34px)',
      lineHeight: .95
    }
  }, "PERSONAL TRAINING"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: '#344054'
    }
  }, A.ASSESSMENT.pathReason), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('group');
    },
    style: {
      fontSize: 13,
      textDecoration: 'underline',
      marginTop: 'auto'
    }
  }, "Prefer a group? See Fundamentals \u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))',
      gap: 10
    }
  }, A.ASSESSMENT.priorities.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.n,
    style: {
      padding: 16,
      border: 'var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      color: 'var(--blue)'
    }
  }, p.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      lineHeight: 1.25
    }
  }, p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--grey-600)'
    }
  }, A.SYSTEMS[p.system].name.toUpperCase()))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H('clamp(32px,4vw,60px)')
  }, "YOUR CURRENT", /*#__PURE__*/React.createElement("br", null), "PRACTICE"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, "3 priorities"), /*#__PURE__*/React.createElement("span", null, "4 exercises"), /*#__PURE__*/React.createElement("span", null, "Next reassessment: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, "Not scheduled"))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 18px',
      borderBottom: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15
    }
  }, "TODAY"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      textDecoration: 'underline'
    }
  }, "Open practice \u2192")), A.ASSESSMENT.plan.map((p, i) => {
    const e = A.EX[p.ex];
    return /*#__PURE__*/React.createElement("a", {
      key: p.ex,
      href: "#",
      onClick: x => {
        x.preventDefault();
        go('library', e.id);
      },
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        gap: 12,
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: 'var(--rule)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17,
        fontWeight: 500
      }
    }, e.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--blue)'
      }
    }, A.SYSTEMS[e.primary].name.toUpperCase()), " \xB7 ", e.dur)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: i === 0 ? '#166534' : 'var(--grey-600)'
      }
    }, i === 0 ? 'Done ✓' : p.presc.freq));
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 15
    }
  }, "RECOMMENDED FOR YOUR PRACTICE"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
      gap: 12
    }
  }, A.rel.practiceTools().map(({
    product: p,
    names
  }) => /*#__PURE__*/React.createElement("a", {
    key: p.id,
    href: "#",
    onClick: x => {
      x.preventDefault();
      go('product', p.id);
    },
    style: {
      padding: 16,
      border: '2px solid var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 500
    }
  }, p.name), /*#__PURE__*/React.createElement("span", null, A.fmt(p.price))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, "Used in ", names.join(', ')))))), proto('Reset account journey', 'success'))));
}
window.AccountScreen = AccountScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Account.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Assessment.jsx
try { (() => {
function AssessmentScreen({
  go
}) {
  const {
    Button,
    ImageSlot
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [f, setF] = React.useState('in-centre');
  const H = {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 'clamp(40px,5vw,80px)',
    lineHeight: .88
  };
  const hair = 'var(--rule)';
  const half = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
    borderBottom: hair
  };
  const observe = [['Intake', 'Your goals, history and what you want to be able to do.'], ['Movement assessment', 'How you squat, hinge, lunge, rotate, carry and walk.'], ['Breath session', 'A short breath trial: mechanics, and how it holds up under effort.'], ['Movement training trial', 'A taste of how we’d actually train you.'], ['One community session', 'Join one ADITUS group session or event.'], ['Practitioner review', 'Your practitioner writes your priorities and recommendation.']];
  const receive = [['Your starting point', 'What your body can do now, and what’s limiting it — in plain language.'], ['Priorities', 'The main things we’d work on, in order.'], ['Practices', 'Exercises to start with, where they’re useful.'], ['Tools — only if useful', 'Suggested products only when they genuinely help.'], ['A report + recommendation', 'Personal or Group Training, and why. Then you choose.']];
  const [hv, setHv] = React.useState('');
  const pathCell = (id, title, d, ph, border) => /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go(id);
    },
    onMouseEnter: () => setHv(id),
    onMouseLeave: () => setHv(''),
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRight: border ? hair : 0,
      background: hv === id ? 'var(--grey-50)' : '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/9'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: ph
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px clamp(16px,2vw,28px) 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      borderTop: hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(28px,3vw,44px)',
      lineHeight: .9
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, d)));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(56px,8vw,128px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "ASSESSMENT FOR TRAINING"), /*#__PURE__*/React.createElement("h1", {
    style: {
      ...H,
      fontSize: 'clamp(48px,7vw,120px)',
      lineHeight: .86
    }
  }, "ADITUS", /*#__PURE__*/React.createElement("br", null), "ASSESSMENT"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(22px,2vw,30px)',
      lineHeight: 1.2,
      letterSpacing: '-.02em'
    }
  }, "Know where you\u2019re starting from."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 420,
      fontSize: 14
    }
  }, "A specialist works out what your body can do now, what\u2019s limiting it, and what to train first. You leave with understanding, priorities and a training direction \u2014 not just a PDF."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 22,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    onClick: () => window.scrollTo({
      top: document.getElementById('buy').offsetTop,
      behavior: 'smooth'
    })
  }, "BOOK ASSESSMENT \xB7 \u20B9XX,XXX"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('qualify');
    },
    style: {
      fontSize: 13,
      textDecoration: 'underline',
      textUnderlineOffset: 5
    }
  }, "Not sure? Find your starting point"))), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 'clamp(420px,72vh,760px)',
      borderLeft: hair
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Practitioner watching a client's single-leg squat, side light, documentary"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(24px,3vw,36px)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H
  }, "WHAT WE", /*#__PURE__*/React.createElement("br", null), "OBSERVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,240px),1fr))',
      borderTop: hair
    }
  }, observe.map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      padding: '22px clamp(16px,2vw,24px) 26px',
      borderRight: hair,
      borderBottom: hair,
      marginRight: -1,
      marginBottom: -1,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minHeight: 170
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--blue)'
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      lineHeight: 1.05
    }
  }, t.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, d))))), /*#__PURE__*/React.createElement("section", {
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      borderRight: hair
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H
  }, "WHAT YOU", /*#__PURE__*/React.createElement("br", null), "LEAVE WITH"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--ink)'
    }
  }, receive.map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'grid',
      gridTemplateColumns: '44px minmax(0,1fr)',
      gap: 12,
      padding: '16px 0',
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)',
      paddingTop: 3
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.015em'
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, d))))), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('account');
    },
    style: {
      alignSelf: 'flex-start',
      fontSize: 13,
      textDecoration: 'underline',
      textUnderlineOffset: 5
    }
  }, "See a sample training plan \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 420,
      background: 'var(--grey-50)',
      padding: 'clamp(28px,4vw,56px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(100%,420px)',
      background: '#fff',
      border: '2px solid var(--ink)',
      boxShadow: '10px 10px 0 var(--ink)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PHOTO: MOVEMENT"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--grey-600)'
    }
  }, "YOUR TRAINING PLAN \xB7 SAMPLE"), A.ASSESSMENT.priorities.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.n,
    style: {
      display: 'grid',
      gridTemplateColumns: '32px 1fr',
      gap: 8,
      padding: '8px 0',
      borderTop: hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      color: 'var(--blue)'
    }
  }, p.n), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--grey-600)'
    }
  }, A.SYSTEMS[p.system].name.toUpperCase())))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px',
      background: 'var(--ice)',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "Recommended:"), " Personal Training, then Fundamentals group after 6 weeks."))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(24px,3vw,36px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H
  }, "YOUR", /*#__PURE__*/React.createElement("br", null), "TRAINING PATH"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 380,
      fontSize: 14
    }
  }, "Your practitioner recommends a path based on what they see. It isn't automatic, and you decide.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      borderTop: hair
    }
  }, pathCell('personal', 'PERSONAL TRAINING', 'Often recommended when priorities need hands-on coaching — pain history, specific restrictions, sport demands.', 'One-to-one session, coach cueing hips', true), pathCell('group', 'GROUP TRAINING', 'Often recommended when you’re ready to train the fundamentals with others, with a coach watching.', 'Small group moving together, mobility session', false))), /*#__PURE__*/React.createElement("section", {
    id: "buy",
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      borderRight: hair
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H
  }, "BOOK YOUR", /*#__PURE__*/React.createElement("br", null), "ASSESSMENT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      borderTop: '2px solid var(--ink)',
      borderBottom: hair,
      fontFamily: 'var(--font-sans)'
    }
  }, [['Duration', '75–90 min'], ['Results', '5 working days'], ['Price', '₹XX,XXX']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      padding: '14px 0',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-600)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [['in-centre', 'IN CENTRE', 'Mumbai · Bengaluru'], ['remote', 'REMOTE', 'Video + kit we send']].map(([id, l, s]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    role: "radio",
    "aria-checked": f === id,
    onClick: () => setF(id),
    style: {
      textAlign: 'left',
      padding: 16,
      border: '2px solid ' + (f === id ? 'var(--ink)' : 'var(--grey-300)'),
      background: f === id ? 'var(--mist)' : '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-700)'
    }
  }, s)))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, "Fee credited towards your first training block if you start within 30 days."), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('account'),
    style: {
      height: 62,
      padding: '0 24px',
      border: 0,
      background: 'var(--ink)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-display)',
      fontSize: 16
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--navy)',
    onMouseLeave: e => e.currentTarget.style.background = 'var(--ink)'
  }, "CHECKOUT \xB7 ", f === 'remote' ? 'REMOTE' : 'IN CENTRE', " \xB7 \u20B9XX,XXX ", /*#__PURE__*/React.createElement("span", null, "\u2192"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      background: 'var(--ice)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16
    }
  }, "NOT SURE YET?"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(24px,2.4vw,34px)',
      lineHeight: 1.1,
      letterSpacing: '-.02em'
    }
  }, "Six questions. Two minutes. We'll tell you honestly if we can help."), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "md",
    style: {
      alignSelf: 'flex-start'
    },
    onClick: () => go('qualify')
  }, "TAKE THE QUALIFICATION QUIZ"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 20,
      borderTop: '1px solid rgba(16,24,40,.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)'
    }
  }, "OR MEET US FIRST"), /*#__PURE__*/React.createElement("span", null, "Introduction to ADITUS \xB7 Thu 15 Oct, 19:00 \xB7 Bandra \xB7 Free"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('community');
    },
    style: {
      textDecoration: 'underline'
    }
  }, "Join an introduction session \u2192")))));
}
window.AssessmentScreen = AssessmentScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Assessment.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Community.jsx
try { (() => {
function CommunityScreen({
  go
}) {
  const {
    ImageSlot,
    Label,
    Button
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [res, setRes] = React.useState({});
  const tog = id => setRes(r => ({
    ...r,
    [id]: !r[id]
  }));
  const hair = 'var(--rule)';
  const H = {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 'clamp(40px,5vw,80px)',
    lineHeight: .88
  };
  const head = (t, side, dark) => /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      maxWidth: 340,
      color: dark ? 'var(--ice)' : 'inherit'
    }
  }, side));
  const CHIP = {
    'Group training': 'var(--ice)',
    Workshop: 'var(--sky)',
    Event: '#fff'
  };
  const people = [['MEERA RAO', 'COACH · MOVEMENT', 'Hips first. Always hips first.', 'var(--blue)'], ['ARJUN MEHTA', 'COACH · BREATH', 'Exhale longer than you think.', 'var(--sky)'], ['PRIYA S.', 'MEMBER SINCE 2024', 'I come for Sunday. I stay for the coffee.', 'var(--ice)'], ['ROHAN D’SOUZA', 'COMMUNITY LEAD', 'Bring a friend. Bring a towel.', 'var(--periwinkle)'], ['KAVYA IYER', 'PHYSIOTHERAPIST', 'Take your shoes off. Seriously.', 'var(--navy)']];
  const recent = [[8, 460, 'Mobility Lab · Wed 30 Sep', 'Mobility Lab, wide, evening'], [4, 460, 'Breath Session · Sat 26 Sep', 'Group lying down, overhead'], [4, 320, 'Feet workshop', 'Close: toes spreading'], [4, 320, 'Recovery: Heat & Cold', 'Steam, sauna door'], [4, 320, 'Open Practice · Juhu', 'Beach, sunrise, 30 people']];
  const formats = [['ADITUS SESSIONS', 'Mobility Lab, every Wednesday', 'Site · posters', 'var(--sky)', 'var(--ink)', 'var(--ink)'], ['FIELD NOTES', 'What 700 people taught us about cold', 'Site · email', '#fff', 'var(--ink)', 'var(--sky)'], ['PEOPLE OF ADITUS', 'Priya, Sunday regular since 2024', 'Social · walls', 'var(--ice)', 'var(--ink)', 'var(--blue)'], ['PRACTICE WITH US', '90/90 Breathing, 5 minutes', 'Social · email', 'var(--blue)', '#fff', 'var(--ice)'], ['WORKSHOPS', 'Feet & Foundation, Sat 31 Oct', 'Site · posters', 'var(--navy)', '#fff', 'var(--sky)'], ['COMMUNITY DAYS', 'Run & Plunge, Sat 17 Oct', 'Social · posters', 'var(--periwinkle)', 'var(--ink)', '#fff'], ['WHAT WE’RE TRAINING', 'October: hip rotation', 'Walls · social', '#fff', 'var(--ink)', 'var(--blue)'], ['WHAT WE’RE LEARNING', 'Sleep and adaptation', 'Email · site', 'var(--ink)', '#fff', 'var(--sky)']];
  const notes = [['FIELD NOTES', 'Why we keep group sizes at eight'], ['WHAT WE’RE TRAINING', 'October is hip rotation month'], ['PEOPLE OF ADITUS', 'Priya on two years of Sundays'], ['WHAT WE’RE LEARNING', 'Sleep and adaptation']];
  const [hv, setHv] = React.useState('');
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 12',
      padding: 'var(--section-y) var(--gutter) clamp(20px,2vw,28px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      ...H,
      fontSize: 'clamp(56px,10vw,176px)',
      lineHeight: .82
    }
  }, "PEOPLE", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, "TRAIN HERE.")), /*#__PURE__*/React.createElement("span", {
    style: {
      maxWidth: 300,
      fontSize: 13
    }
  }, "Training sessions, workshops, run clubs and shared challenges \u2014 and the odd 6 a.m. plunge. You don\u2019t need to be a client to turn up.")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 7',
      minHeight: 'clamp(320px,46vw,620px)',
      borderTop: hair,
      borderRight: hair,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Wide documentary: group session mid-movement, Bandra, morning"
  }), /*#__PURE__*/React.createElement(Label, {
    tone: "sky",
    display: true,
    style: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      padding: '5px 10px'
    }
  }, "ADITUS SESSIONS")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 5',
      display: 'grid',
      gridTemplateRows: '1fr 1fr',
      borderTop: hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: hair,
      minHeight: 160
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Close: two members laughing between sets"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 160
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Coach cueing feet, low angle"
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: hair,
      background: 'var(--navy)',
      color: '#fff'
    }
  }, head(/*#__PURE__*/React.createElement(React.Fragment, null, "NEXT AT", /*#__PURE__*/React.createElement("br", null), "ADITUS"), 'Mumbai · Bengaluru', true), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid rgba(255,255,255,.2)'
    }
  }, A.EVENTS.map(e => {
    const on = !!res[e.id],
      req = e.req === 'After assessment';
    return /*#__PURE__*/React.createElement("div", {
      key: e.id,
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))',
        gap: '10px 20px',
        alignItems: 'center',
        padding: '18px var(--gutter)',
        borderBottom: '1px solid rgba(255,255,255,.2)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        justifySelf: 'start',
        padding: '4px 9px',
        background: CHIP[e.kind] || 'var(--ice)',
        color: 'var(--ink)',
        fontSize: 11
      }
    }, e.date, " \xB7 ", e.time), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        lineHeight: 1.05
      }
    }, e.title.toUpperCase()), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--ice)'
      }
    }, e.desc)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, e.kind.toUpperCase(), " \xB7 ", e.place), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, A.fmt(e.price)), /*#__PURE__*/React.createElement("button", {
      onClick: () => req ? go('assessment') : tog(e.id),
      style: {
        height: 40,
        padding: '0 16px',
        border: '2px solid #fff',
        background: on ? '#fff' : 'transparent',
        color: on ? 'var(--ink)' : '#fff',
        fontFamily: 'var(--font-display)',
        fontSize: 12
      }
    }, req ? 'ASSESSMENT FIRST' : on ? 'RESERVED ✓' : 'RESERVE')));
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: hair
    }
  }, head(/*#__PURE__*/React.createElement(React.Fragment, null, "PEOPLE OF", /*#__PURE__*/React.createElement("br", null), "ADITUS"), 'Recurring faces. Not testimonials.'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      borderTop: hair
    }
  }, people.map(([n, r, l, a]) => /*#__PURE__*/React.createElement("figure", {
    key: n,
    style: {
      margin: 0,
      flex: '0 0 min(72vw,300px)',
      scrollSnapAlign: 'start',
      borderRight: hair,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3/4'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Portrait, natural light, at the space"
  })), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      padding: '14px 16px 18px',
      borderTop: '4px solid ' + a,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 18
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--blue)'
    }
  }, r), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15
    }
  }, "\u201C", l, "\u201D")))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: hair
    }
  }, head(/*#__PURE__*/React.createElement(React.Fragment, null, "RECENT", /*#__PURE__*/React.createElement("br", null), "SESSIONS"), ''), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      borderTop: hair
    }
  }, recent.map(([s, h, c, ph]) => /*#__PURE__*/React.createElement("figure", {
    key: c,
    style: {
      margin: 0,
      gridColumn: 'span ' + s,
      minHeight: h,
      position: 'relative',
      borderRight: hair,
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: ph
  }), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      padding: '4px 9px',
      background: '#fff',
      fontSize: 11
    }
  }, c))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: hair
    }
  }, head(/*#__PURE__*/React.createElement(React.Fragment, null, "FIELD NOTES", /*#__PURE__*/React.createElement("br", null), "& FORMATS"), 'Recurring formats — on the site, on social, in email and on the walls at the space.'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,240px),1fr))',
      borderTop: hair
    }
  }, formats.map(([n, ex, w, bg, fg, line], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    onMouseEnter: () => setHv(n),
    onMouseLeave: () => setHv(''),
    style: {
      aspectRatio: '4/5',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'clamp(16px,2vw,24px)',
      background: bg,
      color: fg,
      borderRight: hair,
      borderBottom: hair,
      marginRight: -1,
      marginBottom: -1,
      transition: 'transform .25s',
      transform: hv === n ? 'translateY(-3px)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "ADITUS"), /*#__PURE__*/React.createElement("span", null, "NO. ", String(i + 1).padStart(2, '0'))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,2.6vw,38px)',
      lineHeight: .9
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 4,
      width: 48,
      background: line
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      lineHeight: 1.25
    }
  }, ex)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10
    }
  }, w.toUpperCase()))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      borderRight: hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/10'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Documentary: 700 people entering the sea at dawn"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px var(--gutter) 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Label, {
    tone: "ice"
  }, "FIELD NOTES \xB7 01 OCT"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,2.8vw,40px)',
      lineHeight: .92
    }
  }, "700 PEOPLE, ONE PLUNGE, ONE BREATH."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "Most were just trying not to swear."))), /*#__PURE__*/React.createElement("div", null, notes.map(([t, n]) => /*#__PURE__*/React.createElement("a", {
    key: n,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      display: 'grid',
      gridTemplateColumns: '110px minmax(0,1fr)',
      gap: 14,
      padding: '18px var(--gutter)',
      borderBottom: hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--blue)'
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 19,
      lineHeight: 1.2
    }
  }, n))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      borderBottom: hair
    }
  }, [['personal', 'PERSONAL TRAINING', 'One-to-one, built from your assessment →', '#fff'], ['group', 'GROUP TRAINING', 'Small groups, same method →', 'var(--sky)']].map(([id, t, d, bg], i) => /*#__PURE__*/React.createElement("a", {
    key: id,
    href: "#",
    onClick: e => {
      e.preventDefault();
      go(id);
    },
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      background: bg,
      borderRight: i ? 0 : hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11
    }
  }, "TRAIN WITH US"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(32px,3.8vw,60px)',
      lineHeight: .88
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, d)))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      background: 'var(--blue)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Label, {
    tone: "ink",
    display: true,
    style: {
      background: '#fff',
      color: 'var(--ink)',
      padding: '4px 10px'
    }
  }, "NEXT EVENT \xB7 SAT 17 OCT \xB7 06:00"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...H,
      fontSize: 'clamp(48px,6.4vw,108px)',
      lineHeight: .84
    }
  }, "RUN &", /*#__PURE__*/React.createElement("br", null), "PLUNGE."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      maxWidth: '30ch'
    }
  }, "5 km easy along Carter Road, then the sea. Breathing guided. Towels not provided."), /*#__PURE__*/React.createElement(Button, {
    variant: "white",
    style: {
      alignSelf: 'flex-start',
      height: 56
    },
    onClick: () => tog('run-plunge')
  }, res['run-plunge'] ? 'RESERVED ✓' : 'RESERVE · ₹2,000')), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 380
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    tone: "dark",
    caption: "Run & Plunge poster image: crowd at the waterline, dawn"
  }))));
}
window.CommunityScreen = CommunityScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Community.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
function HomeScreen({
  go
}) {
  const {
    Button,
    SectionHeader,
    CategoryCard,
    PathCard,
    PracticeCard,
    EventCard,
    AditusMark,
    ImageSlot,
    Label,
    TextLink
  } = window.ADITUSDesignSystem_884a4c;
  const K = window.KIT_DATA;
  const R = '2px solid var(--ink)';
  const [sys, setSys] = React.useState('');
  const cur = K.systems.find(s => s[0] === sys);
  const hl = (bg, fg) => ({
    display: 'inline-block',
    background: bg,
    color: fg,
    padding: '0 .06em'
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / span 8',
      minHeight: 'clamp(340px,62vh,760px)',
      borderRight: R
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PHOTO: MOVEMENT \u2014 large crop, athlete mid-lunge in the space, hard daylight"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '9 / span 4',
      display: 'grid',
      gridTemplateRows: '1fr 1fr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: R,
      background: 'var(--ice)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PHOTO: PRODUCT \u2014 ball under a bare foot, close",
    style: {
      background: 'transparent'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--blue)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    tone: "dark",
    caption: "PHOTO: COMMUNITY \u2014 group laughing after session",
    style: {
      background: 'transparent'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / span 12',
      position: 'relative',
      zIndex: 2,
      padding: '0 var(--gutter)',
      marginTop: 'calc(-1 * clamp(44px,9vw,168px) * .84 * .55)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(44px,9vw,168px)',
      lineHeight: .84,
      letterSpacing: '-.01em'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: hl('#fff')
  }, "BUILD A BODY"), " ", /*#__PURE__*/React.createElement("span", {
    style: hl('var(--blue)', '#fff')
  }, "THAT CAN"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: hl('#fff')
  }, "DO MORE."))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / span 12',
      padding: 'clamp(20px,2.4vw,32px) var(--gutter) clamp(24px,3vw,40px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,22px)',
      maxWidth: '34ch'
    }
  }, "Train with us, one-to-one or in a group. Use the tools we use. Turn up on Sunday."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => go('personal')
  }, "EXPLORE TRAINING"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => go('shop')
  }, "SHOP TOOLS")))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "SHOP ADITUS",
    link: "All tools \u2192",
    href: "#shop"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(min(50%,300px),1fr))',
      borderTop: R
    }
  }, K.cats.map(([t, l, n, tone]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    onClick: () => go('shop'),
    style: {
      borderRight: R,
      borderBottom: R,
      marginRight: -2,
      marginBottom: -2,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(CategoryCard, {
    title: t,
    line: l,
    count: n,
    tone: tone
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: 'TRAIN WITH\nADITUS',
    intro: "Functional, assessment-led training that builds what you actually use: strength, range, control, endurance \u2014 and the recovery to keep it."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))',
      borderTop: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: R
    }
  }, /*#__PURE__*/React.createElement(PathCard, {
    name: "Personal Training",
    line: "One-to-one training built around your actual constraints, goals and capacity.",
    tags: ['ASSESSMENT-LED', 'STRENGTH', 'MOVEMENT', 'BREATH', 'RECOVERY'],
    cta: "EXPLORE PERSONAL TRAINING",
    caption: "PHOTO: TRAINING \u2014 coach cueing a client\u2019s hip, close, documentary",
    minHeight: 620
  })), /*#__PURE__*/React.createElement(PathCard, {
    tone: "blue",
    name: "Group Training",
    line: "Structured practice of the ADITUS method, with a coach and other people.",
    tags: ['SMALL GROUP', 'STRENGTH', 'MOBILITY', 'BREATH', 'WORKSHOPS'],
    cta: "EXPLORE GROUP TRAINING",
    caption: "PHOTO: TRAINING \u2014 eight people moving together, morning light",
    minHeight: 620
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(40px,5vw,80px) var(--gutter)',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(AditusMark, {
    size: "min(100%,460px)",
    active: sys,
    onPick: setSys
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(40px,5vw,80px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(40px,5vw,84px)',
      lineHeight: .86
    }
  }, "FOUR WAYS IN.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, "ONE OUTCOME.")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(17px,1.4vw,20px)',
      maxWidth: '36ch',
      color: 'var(--grey-700)'
    }
  }, "Movement, breath, recovery and performance \u2014 trained together, they build sustainable longevity."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, K.systems.map(([id, l]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setSys(sys === id ? '' : id),
    style: {
      height: 44,
      padding: '0 14px',
      border: R,
      background: sys === id ? 'var(--blue)' : '#fff',
      color: sys === id ? '#fff' : 'var(--ink)',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      transition: 'background-color .4s,color .4s'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: 110,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,2.6vw,38px)',
      color: 'var(--blue)'
    }
  }, cur ? cur[1] : 'SUSTAINABLE LONGEVITY'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px 18px',
      fontFamily: 'var(--font-sans)',
      fontSize: 20
    }
  }, (cur ? cur[2] : ['All four, working together, over years.']).map(t => /*#__PURE__*/React.createElement("span", {
    key: t
  }, t)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "LIBRARY",
    link: "Explore the library \u2192"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
      borderTop: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: R
    }
  }, /*#__PURE__*/React.createElement(PracticeCard, {
    title: "90/90 Hip Rotation",
    meta1: "MOVEMENT \xB7 HIPS",
    meta2: "6 MIN \xB7 Loop Band Set",
    caption: "PHOTO: MOVEMENT \u2014 90/90 hip rotation, side view, video still"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: R
    }
  }, /*#__PURE__*/React.createElement(PracticeCard, {
    type: "INSIGHT",
    tone: "ice",
    title: "What we mean by capability",
    meta1: "TRAINING",
    meta2: "5 MIN READ",
    caption: "PHOTO: EDITORIAL \u2014 loaded carry, side profile, studio"
  })), /*#__PURE__*/React.createElement(PracticeCard, {
    type: "CLIENT STORY",
    tone: "navy",
    title: "Running again without the knee",
    meta1: "PERSONAL TRAINING",
    meta2: "Aisha, 34",
    caption: "PHOTO: CLIENT \u2014 Aisha running on Carter Road, early light"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: R,
      background: 'var(--sky)'
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    title: 'NEXT AT\nADITUS',
    link: "See what\u2019s on \u2192"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))',
      borderTop: R
    }
  }, K.events.map(e => /*#__PURE__*/React.createElement("div", {
    key: e[2],
    style: {
      borderRight: R,
      marginRight: -2,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(EventCard, {
    date: e[0],
    time: e[1],
    title: e[2],
    place: e[3],
    req: e[4]
  })))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y-lg) var(--gutter)',
      background: 'var(--blue)',
      color: '#fff',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 26
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(48px,7vw,124px)',
      lineHeight: .84
    }
  }, "READY FOR", /*#__PURE__*/React.createElement("br", null), "MORE?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "white",
    onClick: () => go('personal')
  }, "EXPLORE TRAINING"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    onClick: () => go('shop')
  }, "SHOP TOOLS"))), /*#__PURE__*/React.createElement(AditusMark, {
    color: "#FFFFFF",
    size: 130
  })));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Library.jsx
try { (() => {
function LibraryScreen({
  go,
  id
}) {
  const A = window.ADITUS;
  if (id && A.EX[id]) return /*#__PURE__*/React.createElement(ExerciseDetail, {
    e: A.EX[id],
    go: go
  });
  if (id && A.AR[id]) return /*#__PURE__*/React.createElement(InsightDetail, {
    a: A.AR[id],
    go: go
  });
  return /*#__PURE__*/React.createElement(LibraryIndex, {
    go: go
  });
}
function LibraryIndex({
  go
}) {
  const {
    ImageSlot
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sys, setSys] = React.useState([]);
  const all = [...A.EXERCISES.map(e => ({
    kind: 'ex',
    id: e.id,
    type: 'EXERCISE',
    bg: 'var(--blue)',
    fg: '#fff',
    title: e.name,
    m1: A.SYSTEMS[e.primary].name.toUpperCase() + ' · ' + e.topic.toUpperCase(),
    m2: e.dur.toUpperCase(),
    m3: e.level,
    sys: e.primary,
    video: true,
    dur: e.dur,
    ph: e.ph,
    ratio: '4/3'
  })), ...A.ARTICLES.filter(a => a.kind === 'education').map(a => ({
    kind: 'ins',
    id: a.id,
    type: 'INSIGHT',
    bg: 'var(--ice)',
    fg: 'var(--ink)',
    title: a.title,
    m1: a.cat.toUpperCase(),
    m2: a.read.toUpperCase() + ' READ',
    m3: a.intro,
    sys: a.system,
    ph: a.ph,
    ratio: '4/3'
  })), ...A.STORIES.map(s => ({
    kind: 'story',
    id: s.id,
    type: 'CLIENT STORY',
    bg: 'var(--navy)',
    fg: '#fff',
    title: s.title,
    m1: s.training.toUpperCase(),
    m2: s.name,
    m3: s.desc,
    sys: s.systems[0],
    ph: s.ph,
    ratio: '4/3'
  }))];
  const tabs = [['all', 'ALL'], ['ex', 'EXERCISES'], ['ins', 'INSIGHTS'], ['story', 'CLIENT STORIES']];
  const cards = all.filter(c => (tab === 'all' || c.kind === tab) && (!sys.length || sys.includes(c.sys)) && (!q || c.title.toLowerCase().includes(q.toLowerCase())));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(40px,5vw,80px) var(--gutter) clamp(20px,2vw,28px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(56px,8vw,136px)',
      lineHeight: .84
    }
  }, "PRACTICE"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 400,
      fontSize: 13
    }
  }, "Exercises, insights and client stories \u2014 so you can understand, notice and practise what your body needs. Every exercise says why we train it. Free.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 60,
      zIndex: 30,
      background: '#fff',
      borderTop: '2px solid var(--ink)',
      borderBottom: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      overflowX: 'auto',
      borderBottom: 'var(--rule)'
    }
  }, tabs.map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      flex: '1 0 auto',
      minWidth: 130,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      border: 0,
      borderRight: '2px solid var(--ink)',
      background: tab === k ? 'var(--ink)' : '#fff',
      color: tab === k ? '#fff' : 'var(--ink)',
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, l, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10
    }
  }, k === 'all' ? all.length : all.filter(c => c.kind === k).length)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px var(--gutter)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "search",
    placeholder: "SEARCH PRACTICE",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      flex: '1 1 220px',
      minWidth: 0,
      height: 42,
      padding: '0 14px',
      border: '2px solid var(--ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      outlineColor: 'var(--blue)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, A.SYS_ORDER.map(k => {
    const on = sys.includes(k);
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => setSys(on ? sys.filter(x => x !== k) : [...sys, k]),
      style: {
        height: 42,
        padding: '0 12px',
        border: '2px solid ' + (on ? 'var(--blue)' : 'var(--ink)'),
        background: on ? 'var(--blue)' : '#fff',
        color: on ? '#fff' : 'var(--ink)',
        fontSize: 11
      }
    }, A.SYSTEMS[k].name.toUpperCase());
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(16px,2vw,28px) var(--gutter) clamp(48px,6vw,80px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))',
      gap: 'clamp(14px,1.6vw,22px)'
    }
  }, cards.map(c => /*#__PURE__*/React.createElement(LibCard, {
    key: c.id,
    c: c,
    onClick: () => go('library', c.kind === 'story' ? null : c.id)
  }))), !cards.length && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 0',
      fontSize: 14
    }
  }, "Nothing matches. ", /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setQ('');
      setSys([]);
      setTab('all');
    },
    style: {
      background: 'none',
      border: 0,
      padding: 0,
      textDecoration: 'underline',
      fontSize: 14
    }
  }, "Clear search & filters"))));
}
function LibCard({
  c,
  onClick
}) {
  const {
    ImageSlot
  } = window.ADITUSDesignSystem_884a4c;
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onClick();
    },
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid var(--ink)',
      background: '#fff',
      color: 'var(--ink)',
      transition: 'transform .25s',
      transform: h ? 'translate(-3px,-3px)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: c.ratio,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: c.ph
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 10,
      top: 10,
      padding: '3px 9px',
      background: c.bg,
      color: c.fg,
      fontFamily: 'var(--font-display)',
      fontSize: 11
    }
  }, c.type), c.video && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      height: 30,
      padding: '0 10px',
      background: 'var(--ink)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      fontSize: 10
    }
  }, "\u25B6 ", c.dur)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      borderTop: '2px solid var(--ink)',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(19px,1.6vw,23px)',
      lineHeight: 1.02
    }
  }, c.title.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, c.m1), " \xB7 ", c.m2), c.m3 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-700)',
      marginTop: 'auto',
      paddingTop: 6
    }
  }, c.m3)));
}
function ExerciseDetail({
  e,
  go
}) {
  const {
    ImageSlot,
    StepList,
    Label
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const tools = A.rel.productsForExercise(e.id),
    ins = A.rel.articlesForExercise(e.id),
    ev = A.rel.eventForExercise(e.id);
  const R = '2px solid var(--ink)';
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px var(--gutter)',
      borderBottom: R,
      fontSize: 11,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: x => {
      x.preventDefault();
      go('library');
    }
  }, "PRACTICE / EXERCISES"), /*#__PURE__*/React.createElement("span", null, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, A.SYSTEMS[e.primary].name.toUpperCase())), /*#__PURE__*/React.createElement("header", {
    style: {
      padding: 'clamp(32px,4vw,56px) var(--gutter) clamp(20px,2vw,28px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Label, {
    display: true
  }, "EXERCISE"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(44px,6.4vw,108px)',
      lineHeight: .86
    }
  }, e.name.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
      borderTop: R,
      borderBottom: 'var(--rule)',
      fontFamily: 'var(--font-sans)'
    }
  }, [['Duration', e.dur], ['Level', e.level], ['System', A.SYSTEMS[e.primary].name], ['Focus', e.topic]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      padding: '12px 0',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-600)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 500
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/8',
      borderTop: R,
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: e.ph
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(36px,4vw,64px) var(--gutter)',
      borderRight: R,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--ice)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(28px,3.2vw,44px)',
      lineHeight: .9
    }
  }, "WHY WE", /*#__PURE__*/React.createElement("br", null), "TRAIN THIS"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(19px,1.6vw,23px)',
      lineHeight: 1.35
    }
  }, e.why), e.principle && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '14px 16px',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "THE BIGGER PRINCIPLE"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17
    }
  }, e.principle)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      paddingTop: 12,
      borderTop: '1px solid rgba(16,24,40,.2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)'
    }
  }, "WHEN \xB7 "), e.when)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(36px,4vw,64px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 20
    }
  }, "HOW TO DO IT"), /*#__PURE__*/React.createElement(StepList, {
    steps: e.how
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
      gap: 10,
      fontFamily: 'var(--font-sans)'
    }
  }, [['BREATHING / TEMPO', e.breathing], ['DOSAGE', e.dosage]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      padding: 14,
      border: R,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 12
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
      gap: 18
    }
  }, [['WHAT TO NOTICE', e.notice, '+'], ['COMMON ERRORS', e.errors, '×']].map(([k, l, g]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, k), l.map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      fontSize: 14,
      padding: '6px 0',
      borderTop: 'var(--rule)'
    }
  }, g, " ", n))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
      borderBottom: R
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(28px,3vw,44px) var(--gutter)',
      borderRight: R,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 18
    }
  }, "TOOLS USED"), !tools.length && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--grey-700)'
    }
  }, "None. Just you and the floor."), tools.map(p => /*#__PURE__*/React.createElement("a", {
    key: p.id,
    href: "#",
    onClick: x => {
      x.preventDefault();
      go('product', p.id);
    },
    style: {
      display: 'grid',
      gridTemplateColumns: '64px minmax(0,1fr)',
      gap: 12,
      alignItems: 'center',
      padding: 10,
      border: R
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PRODUCT"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--blue)'
    }
  }, "View tool \xB7 ", A.fmt(p.price), " \u2192"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(28px,3vw,44px) var(--gutter)',
      borderRight: R,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 18
    }
  }, "RELATED INSIGHTS"), ins.map(a => /*#__PURE__*/React.createElement("a", {
    key: a.id,
    href: "#",
    onClick: x => {
      x.preventDefault();
      go('library', a.id);
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 0',
      borderTop: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--blue)'
    }
  }, "INSIGHT \xB7 ", a.read.toUpperCase(), " READ"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17
    }
  }, a.title)))), ev && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(28px,3vw,44px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      background: 'var(--sky)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13
    }
  }, "PRACTISE THIS IN A GROUP"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 21,
      lineHeight: 1.15
    }
  }, ev.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, ev.date, " \xB7 ", ev.time, " \xB7 ", ev.place), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('group'),
    style: {
      alignSelf: 'flex-start',
      marginTop: 6,
      height: 42,
      padding: '0 16px',
      border: 0,
      background: 'var(--ink)',
      color: '#fff',
      fontFamily: 'var(--font-display)',
      fontSize: 12
    }
  }, "SEE SESSION \u2192"))));
}
function InsightDetail({
  a,
  go
}) {
  const {
    ImageSlot,
    Label
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const exs = a.exercises.map(x => A.EX[x]).filter(Boolean),
    tools = a.products.map(p => A.PR[p]).filter(Boolean);
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      minHeight: 'clamp(420px,70vh,760px)',
      display: 'flex',
      alignItems: 'flex-end',
      borderBottom: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: a.ph
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      margin: 'clamp(12px,2vw,28px)',
      padding: 'clamp(20px,3vw,40px)',
      background: '#fff',
      border: '2px solid var(--ink)',
      maxWidth: 820,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Label, {
    tone: "ice",
    display: true
  }, "INSIGHT \xB7 ", (A.SYSTEMS[a.system] || {
    name: a.cat
  }).name.toUpperCase()), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(36px,5vw,80px)',
      lineHeight: .88
    }
  }, a.title.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,22px)'
    }
  }, a.intro), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--grey-600)'
    }
  }, a.author, " \xB7 ", a.date, " \xB7 ", a.read.toUpperCase(), " READ"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,2fr) minmax(260px,1fr)',
      gap: 'clamp(32px,5vw,80px)',
      padding: 'clamp(40px,5vw,80px) var(--gutter)',
      borderBottom: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 22,
      lineHeight: 1.5
    }
  }, a.body[0]), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 19,
      lineHeight: 1.6
    }
  }, a.body[1]), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: '10px 0',
      paddingLeft: 18,
      borderLeft: '6px solid var(--blue)',
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,2.8vw,40px)',
      lineHeight: 1
    }
  }, "\u201C", a.pull, "\u201D"), /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/9',
      border: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "DIAGRAM \u2014 biomechanics illustration to be commissioned"
  })), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--grey-600)'
    }
  }, "FIG. 1 \u2014 Diagram placeholder")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 19,
      lineHeight: 1.6
    }
  }, a.body[2])), /*#__PURE__*/React.createElement("aside", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      alignSelf: 'start',
      position: 'sticky',
      top: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      border: '2px solid var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, "RELATED EXERCISE"), exs.map(x => /*#__PURE__*/React.createElement("a", {
    key: x.id,
    href: "#",
    onClick: ev => {
      ev.preventDefault();
      go('library', x.id);
    },
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 10,
      padding: '8px 0',
      borderTop: 'var(--rule)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, x.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, x.dur)))), tools.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      background: 'var(--ice)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, "RELATED PRODUCT"), tools.map(p => /*#__PURE__*/React.createElement("a", {
    key: p.id,
    href: "#",
    onClick: ev => {
      ev.preventDefault();
      go('product', p.id);
    },
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 10,
      padding: '8px 0',
      borderTop: '1px solid rgba(16,24,40,.15)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, p.name), /*#__PURE__*/React.createElement("span", null, A.fmt(p.price))))))));
}
Object.assign(window, {
  LibraryScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Library.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/PlatformMap.jsx
try { (() => {
function PlatformMapScreen({
  go
}) {
  const G = [{
    title: 'BRAND & TRAINING',
    items: [['Home — product + training first', '/', 'home'], ['About — philosophy & method', '/about', 'about'], ['Qualify', '/qualify', 'qualify'], ['Assessment', '/assessment', 'assessment'], ['Personal Training', '/training/personal', 'personal'], ['Group Training', '/training/group', 'group'], ['Community', '/community', 'community']]
  }, {
    title: 'KNOWLEDGE',
    items: [['Practice library', '/practice', 'library'], ['Practice detail', '/practice/90-90-breathing', 'library', '90-90-breathing'], ['Article', '/learn/posture-under-load', 'library', 'posture-under-load']]
  }, {
    title: 'SHOP',
    items: [['Shop', '/shop', 'shop'], ['Product — Fascia Ball', '/products/fascia-ball', 'product', 'fascia-ball'], ['Product — Toe Spacers', '/products/toe-spacers', 'product', 'toe-spacers'], ['Product — Amber Frames', '/products/evening-amber-frames', 'product', 'evening-amber-frames']]
  }, {
    title: 'ACCOUNT',
    items: [['Payment success → training plan', '/checkout/thank-you', 'account']]
  }];
  const chain = [['DISCOVER', 'Home', 'home'], ['UNDERSTAND', 'The method', 'about'], ['BEGIN', 'Assessment', 'assessment'], ['BUY', 'Checkout → onboarding', 'account'], ['TRAIN', 'Personal Training', 'personal'], ['TOGETHER', 'Group Training', 'group']];
  const [h, setH] = React.useState('');
  let n = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      padding: 'clamp(40px,5vw,72px) var(--gutter) 28px',
      borderBottom: 'var(--rule)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "ADITUS \xB7 PROTOTYPE INDEX"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(44px,6vw,96px)',
      lineHeight: .88
    }
  }, "PLATFORM MAP.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 460,
      fontSize: 14
    }
  }, "Discover \u2192 movement, breath, recovery \u2192 (quiz) \u2192 assessment \u2192 training plan \u2192 Personal or Group Training \u2192 practice \u2192 reassess. Community around everything; Practice, Learn and Shop support it.")), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '24px var(--gutter)',
      borderBottom: 'var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16
    }
  }, "THE MAIN JOURNEY \u2014 CLICK THROUGH"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center'
    }
  }, chain.map(([k, v, r], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go(r),
    onMouseEnter: () => setH(k),
    onMouseLeave: () => setH(''),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2,
      padding: '12px 14px',
      border: '2px solid var(--ink)',
      background: h === k ? 'var(--mist)' : '#fff',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--blue)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 500
    }
  }, v)), i < chain.length - 1 && /*#__PURE__*/React.createElement("span", null, "\u2192"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))'
    }
  }, G.map(g => /*#__PURE__*/React.createElement("section", {
    key: g.title,
    style: {
      padding: '24px clamp(16px,2vw,28px)',
      borderRight: 'var(--rule)',
      borderBottom: 'var(--rule)',
      marginRight: -1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      marginBottom: 8
    }
  }, g.title), g.items.map(([l, u, r, id]) => {
    const no = String(++n).padStart(2, '0');
    return /*#__PURE__*/React.createElement("button", {
      key: l,
      onClick: () => go(r, id),
      style: {
        display: 'grid',
        gridTemplateColumns: '36px minmax(0,1fr) auto',
        gap: 8,
        alignItems: 'baseline',
        padding: '9px 0',
        border: 0,
        borderTop: 'var(--rule)',
        background: 'none',
        textAlign: 'left',
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--blue)'
      }
    }, no), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 15
      }
    }, l), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--grey-600)'
      }
    }, u));
  })))));
}
window.PlatformMapScreen = PlatformMapScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/PlatformMap.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Product.jsx
try { (() => {
function ProductScreen({
  id,
  go,
  addToCart,
  cart
}) {
  const {
    VariantSelector,
    Button,
    SpecList,
    StepList,
    ImageSlot
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS,
    raw = A && A.PR[id];
  const p = window.KIT_DATA.products.find(x => x.id === id) || (raw ? {
    id: raw.id,
    name: raw.name,
    type: raw.usedFor,
    price: A.fmt(raw.price),
    cat: raw.type,
    variants: raw.variants,
    why: raw.why,
    specs: raw.specs,
    how: raw.howTo
  } : window.KIT_DATA.products[1]);
  const [v, setV] = React.useState(p.variants[Math.min(1, p.variants.length - 1)]);
  const added = cart.includes(p.id);
  const H2 = {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    fontSize: 'clamp(32px,3.6vw,52px)',
    lineHeight: .92
  };
  const half = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
    borderBottom: 'var(--rule)'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px var(--gutter)',
      borderBottom: 'var(--rule)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('shop');
    }
  }, "\u2190 SHOP"), " / ", p.cat.toUpperCase()), /*#__PURE__*/React.createElement("section", {
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      borderRight: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / span 2',
      aspectRatio: '1/1',
      borderBottom: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: p.name + ' — product photography, natural light'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1/1',
      borderRight: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "In use \u2014 human context"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1/1'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Material detail, macro"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(28px,4vw,56px) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 96,
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blue)'
    }
  }, "MOVEMENT"), " \xB7 ", p.cat), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(44px,5.6vw,92px)',
      lineHeight: .88
    }
  }, p.name.toUpperCase()), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 440
    }
  }, p.type, ". ", p.why), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '14px 0',
      borderTop: '2px solid var(--ink)',
      borderBottom: '2px solid var(--ink)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 32,
      fontWeight: 500,
      letterSpacing: '-.02em'
    }
  }, p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, "Ships in 2\u20133 days \xB7 Free returns")), /*#__PURE__*/React.createElement(VariantSelector, {
    options: p.variants,
    value: v,
    onChange: setV
  }), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "xl",
    style: {
      fontSize: 17
    },
    onClick: () => addToCart(p.id)
  }, added ? 'ADDED TO CART ✓' : 'ADD TO CART — ' + p.price)))), /*#__PURE__*/React.createElement("section", {
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      borderRight: 'var(--rule)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H2
  }, "WHY ADITUS", /*#__PURE__*/React.createElement("br", null), "USES IT"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(20px,1.6vw,24px)',
      lineHeight: 1.35,
      letterSpacing: '-.015em',
      maxWidth: '34ch'
    }
  }, p.why)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H2
  }, "HOW TO USE"), /*#__PURE__*/React.createElement(StepList, {
    steps: p.how
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))',
      gap: 32,
      borderBottom: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: H2
  }, "SPECIFICATIONS"), /*#__PURE__*/React.createElement(SpecList, {
    items: p.specs
  })));
}
window.ProductScreen = ProductScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Product.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Qualify.jsx
try { (() => {
function QualifyScreen({
  go
}) {
  const {
    Button,
    OptionRow,
    ProgressBar,
    ImageSlot,
    Label
  } = window.ADITUSDesignSystem_884a4c;
  const Q = window.KIT_DATA.quiz;
  const [step, setStep] = React.useState(-1);
  const [ans, setAns] = React.useState({});
  if (step === -1) return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,460px),1fr))',
      minHeight: 'calc(100vh - 60px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(56px,8vw,120px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "/QUALIFY \xB7 2\u20133 MIN"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(48px,7vw,116px)',
      lineHeight: .86
    }
  }, "FIND YOUR", /*#__PURE__*/React.createElement("br", null), "STARTING POINT."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(19px,1.6vw,23px)',
      lineHeight: 1.35,
      maxWidth: '30ch'
    }
  }, "Answer a few questions about what you want to work on and how you want to train."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    size: "xl",
    onClick: () => setStep(0)
  }, "START"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14,
      textDecoration: 'underline',
      textUnderlineOffset: 5
    }
  }, "Start with an Assessment \u2192")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-600)'
    }
  }, Q.length, " questions \xB7 no sign-up to see your result")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      minHeight: 420,
      background: 'var(--ice)',
      borderLeft: 'var(--rule)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Close crop: feet and hands mid-movement, training floor",
    style: {
      background: 'transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 10,
      background: 'var(--sky)'
    }
  })));
  if (step >= Q.length) return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(56px,8vw,120px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      maxWidth: 900,
      minHeight: 'calc(100vh - 60px)',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)'
    }
  }, "YOUR STARTING POINT"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(44px,6vw,96px)',
      lineHeight: .88
    }
  }, "START WITH AN", /*#__PURE__*/React.createElement("br", null), "ASSESSMENT."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      maxWidth: '34ch'
    }
  }, "A specialist works out what your body can do now, what\u2019s limiting it, and what to train first."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    onClick: () => go('home')
  }, "BOOK ASSESSMENT"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setAns({});
      setStep(0);
    },
    style: {
      background: 'none',
      border: 0,
      padding: 0,
      fontSize: 14,
      textDecoration: 'underline',
      textUnderlineOffset: 5
    }
  }, "Retake quiz \u2192")));
  const q = Q[step],
    sel = ans[step] || [];
  const pick = i => {
    const n = q.multi ? sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i].slice(-3) : [i];
    setAns({
      ...ans,
      [step]: n
    });
    if (!q.multi) setTimeout(() => setStep(step + 1), 220);
  };
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 60px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px var(--gutter)',
      borderBottom: 'var(--rule)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep(step - 1),
    style: {
      background: 'none',
      border: 0,
      padding: '6px 0',
      fontSize: 12
    }
  }, "\u2190 BACK"), /*#__PURE__*/React.createElement("span", null, step + 1, " / ", Q.length)), /*#__PURE__*/React.createElement(ProgressBar, {
    value: (step + 1) / Q.length
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 'clamp(32px,5vw,72px) var(--gutter) 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(20px,3vw,32px)',
      maxWidth: 1000
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(32px,4.4vw,64px)',
      lineHeight: .92
    }
  }, q.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-600)'
    }
  }, q.hint)), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--ink)'
    }
  }, q.opts.map(([l, d], i) => /*#__PURE__*/React.createElement(OptionRow, {
    key: l,
    label: l,
    desc: d,
    multi: q.multi,
    checked: sel.includes(i),
    onClick: () => pick(i)
  }))), q.multi && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    size: "lg",
    disabled: !sel.length,
    onClick: () => setStep(step + 1)
  }, "NEXT \u2192"))));
}
window.QualifyScreen = QualifyScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Qualify.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Shop.jsx
try { (() => {
function ShopScreen({
  go,
  cart,
  addToCart,
  openCart
}) {
  const {
    SectionHeader,
    ProductCard,
    CategoryBar,
    Pill,
    Button
  } = window.ADITUSDesignSystem_884a4c;
  const K = window.KIT_DATA;
  const [cat, setCat] = React.useState('All');
  const items = K.products.filter(p => cat === 'All' || p.cat === cat);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 60,
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement(CategoryBar, {
    items: ['All', ...K.cats.map(c => c[0])],
    value: cat,
    onChange: setCat,
    cartCount: cart.length,
    onCart: openCart
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(24px,3vw,36px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(56px,8vw,128px)',
      lineHeight: .86
    }
  }, cat === 'All' ? 'SHOP' : cat.toUpperCase()), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,22px)',
      maxWidth: '30ch'
    }
  }, "Tools we use for training, recovery and daily practice.")), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '14px var(--gutter)',
      borderTop: 'var(--rule)',
      borderBottom: 'var(--rule)',
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--grey-600)'
    }
  }, "OR BROWSE BY SYSTEM"), ['MOVEMENT', 'BREATH', 'RECOVERY', 'PERFORMANCE'].map(s => /*#__PURE__*/React.createElement(Pill, {
    key: s
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(min(50%,240px),1fr))',
      borderBottom: 'var(--rule)'
    }
  }, items.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      borderRight: 'var(--rule)',
      borderBottom: 'var(--rule)',
      marginRight: -1,
      marginBottom: -1,
      cursor: 'pointer'
    },
    onClick: e => {
      if (e.target.tagName !== 'BUTTON') go('product', p.id);
    }
  }, /*#__PURE__*/React.createElement(ProductCard, {
    name: p.name,
    type: p.type,
    price: p.price,
    tag: p.tag,
    actionLabel: cart.includes(p.id) ? 'ADDED ✓' : 'ADD +',
    onAction: () => addToCart(p.id)
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: 'clamp(36px,4vw,56px) var(--gutter)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(24px,2.6vw,36px)'
    }
  }, "ALL ", K.products.length, " PRODUCTS"), /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    size: "md",
    onClick: () => setCat('All')
  }, "BROWSE ALL \u2192")));
}
function CartDrawer({
  cart,
  onClose,
  remove
}) {
  const {
    Button
  } = window.ADITUSDesignSystem_884a4c;
  const K = window.KIT_DATA;
  const items = cart.map(id => K.products.find(p => p.id === id));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(16,24,40,.4)'
    }
  }), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'relative',
      width: 'min(100%,420px)',
      background: '#fff',
      borderLeft: '2px solid var(--ink)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 60,
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20
    }
  }, "CART ", cart.length), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      width: 44,
      height: 44,
      border: '2px solid var(--ink)',
      background: '#fff',
      fontFamily: 'var(--font-display)',
      fontSize: 18
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, items.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      padding: 20,
      color: 'var(--grey-700)'
    }
  }, "Nothing here yet.") : items.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 12,
      padding: '14px 20px',
      borderBottom: 'var(--rule)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, p.variants[0])), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", null, p.price), /*#__PURE__*/React.createElement("button", {
    onClick: () => remove(p.id),
    style: {
      border: 0,
      background: 'none',
      padding: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textDecoration: 'underline'
    }
  }, "Remove"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      borderTop: '2px solid var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--grey-700)'
    }
  }, "Ships in 2\u20133 days \xB7 Free returns"), /*#__PURE__*/React.createElement(Button, {
    full: true,
    size: "xl"
  }, "CHECKOUT"))));
}
Object.assign(window, {
  ShopScreen,
  CartDrawer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Shop.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Training.jsx
try { (() => {
const TR = {
  h2: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 400,
    lineHeight: .88
  },
  kick: {
    fontSize: 12,
    color: 'var(--blue)'
  },
  hair: 'var(--rule)'
};
function PersonalScreen({
  go
}) {
  const {
    Button,
    AditusMark,
    ImageSlot,
    TextLink
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [sys, setSys] = React.useState('');
  const IN = {
    performance: 'Strength, conditioning and sport-specific work — the capacity to do more.',
    movement: 'Strength, mobility, biomechanics and skill — usually the bulk of the session.',
    breathwork: 'Breathing coached under load and effort, so you can hold position and keep going.',
    recovery: 'Load planning, sleep and recovery work, so the training actually sticks.'
  };
  const session = [['0–10', 'Check in', 'How you slept, how you feel, what hurts.', 'Coach and client talking, notebook'], ['10–25', 'Prepare', 'Release and breathing to set position.', 'Ribcage breathing, coach hand on back'], ['25–50', 'Train', 'Movement work at your edge, with control.', 'Loaded hip rotation, focused'], ['50–60', 'Take it home', 'Two practices for the week.', 'Client noting practice on phone']];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      borderBottom: '2px solid var(--ink)',
      minHeight: 'clamp(520px,82vh,880px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 6',
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: TR.kick
  }, "/TRAINING/PERSONAL"), /*#__PURE__*/React.createElement("h1", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(40px,5.2vw,88px)',
      lineHeight: .86
    }
  }, "PERSONAL", /*#__PURE__*/React.createElement("br", null), "TRAINING"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,22px)',
      lineHeight: 1.35,
      maxWidth: '30ch'
    }
  }, "Individual training shaped by your assessment, priorities, goals and physical capacity."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)',
      maxWidth: '36ch'
    }
  }, "Movement, strength, breath, recovery and performance \u2014 including sport-specific work. Not rehab, not a stretching class."), /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    size: "lg",
    style: {
      alignSelf: 'flex-start',
      marginTop: 6,
      height: 56,
      fontSize: 14
    },
    onClick: () => go('assessment')
  }, "START WITH AN ASSESSMENT")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 6',
      minHeight: 420,
      borderLeft: '2px solid var(--ink)'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "PHOTO: TRAINING \u2014 coach and client mid-lift, documentary, natural light"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: TR.hair,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      alignItems: 'center',
      gap: 'clamp(24px,4vw,64px)',
      padding: 'clamp(64px,9vw,140px) var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(AditusMark, {
    size: "min(100%,440px)",
    active: sys,
    onPick: setSys
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(28px,4vw,48px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: TR.kick
  }, "WHAT WE TRAIN"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(36px,4.4vw,68px)',
      lineHeight: .9
    }
  }, "WHAT A SESSION", /*#__PURE__*/React.createElement("br", null), "BUILDS.")), /*#__PURE__*/React.createElement("div", null, A.SYS_ORDER.map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    onMouseEnter: () => setSys(k),
    onClick: () => setSys(k),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 16,
      padding: '16px 0',
      border: 0,
      borderTop: TR.hair,
      background: 'none',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(24px,2.6vw,38px)',
      lineHeight: 1,
      color: sys === k ? 'var(--blue)' : sys ? 'var(--grey-400)' : 'var(--ink)',
      transition: 'color .4s'
    }
  }, A.SYSTEMS[k].name.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      color: 'var(--grey-700)',
      textAlign: 'right'
    }
  }, A.SYSTEMS[k].line)))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,21px)',
      minHeight: '2.6em'
    }
  }, sys ? IN[sys] : 'Strength, mobility, biomechanics, breath and recovery — weighted to what your assessment found.'))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--ink)',
      color: '#fff',
      padding: 'clamp(64px,9vw,140px) var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(12,minmax(0,1fr))',
      gap: 'clamp(24px,4vw,64px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 5',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--sky)'
    }
  }, "HOW IT WORKS"), /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(36px,4.2vw,68px)',
      lineHeight: .9
    }
  }, "THERE IS NO", /*#__PURE__*/React.createElement("br", null), "FIXED ADITUS", /*#__PURE__*/React.createElement("br", null), "PROGRAMME.")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 'span 7',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(18px,1.5vw,22px)',
      lineHeight: 1.5,
      maxWidth: '60ch'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Everyone moves differently, recovers differently and wants different things from their body."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "We start by assessing how you move, breathe, recover and perform \u2014 and what you want to be capable of \u2014 then work out what needs the most attention."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "From there you continue through Personal Training or Group Training, depending on how much support and structure you want."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--ice)'
    }
  }, ['ASSESS', '→', 'PRIORITIES', '→', 'PERSONAL OR GROUP', '→', 'REASSESS'].map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, t))), /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    style: {
      alignSelf: 'flex-start',
      height: 56,
      fontSize: 14
    },
    onClick: () => go('assessment')
  }, "START ASSESSMENT"))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(20px,3vw,32px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(40px,5vw,80px)'
    }
  }, "A SESSION"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "60 minutes \xB7 ADITUS Bandra or Indiranagar")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
      borderTop: TR.hair
    }
  }, session.map(([t, n, d, ph]) => /*#__PURE__*/React.createElement("figure", {
    key: n,
    style: {
      margin: 0,
      marginRight: -1,
      borderRight: TR.hair,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '3/4'
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: ph
  })), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      padding: '14px 16px 18px',
      borderTop: TR.hair,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--blue)'
    }
  }, t, " MIN"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17
    }
  }, n.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, d)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) clamp(20px,3vw,32px)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(40px,5vw,80px)'
    }
  }, "WHO YOU'LL", /*#__PURE__*/React.createElement("br", null), "TRAIN WITH")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: TR.hair
    }
  }, A.PRACTITIONERS.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: i % 2 ? 'row-reverse' : 'row',
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 300px',
      aspectRatio: '4/3',
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: 'Portrait: ' + c.name + ', at work, natural light'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 320px',
      padding: 'clamp(24px,3vw,48px) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: TR.kick
  }, c.role.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(32px,3.6vw,56px)',
      lineHeight: .9
    }
  }, c.name.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 19,
      maxWidth: '34ch'
    }
  }, c.bio)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      borderRight: TR.hair
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(36px,4.4vw,64px)'
    }
  }, "PROGRAMME", /*#__PURE__*/React.createElement("br", null), "OPTIONS"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      maxWidth: 440
    }
  }, "From \u20B9XX,XXX / month. Frequency and length depend on what your assessment finds."), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      border: '2px dashed var(--grey-400)',
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, "The goal isn\u2019t to keep you dependent on a coach. It\u2019s to help you understand your body well enough to keep training on your own terms.")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      background: 'var(--ice)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(28px,3vw,44px)',
      lineHeight: .9
    }
  }, "EVERY PLAN STARTS WITH AN ASSESSMENT."), /*#__PURE__*/React.createElement(Button, {
    style: {
      alignSelf: 'flex-start',
      height: 56
    },
    onClick: () => go('assessment')
  }, "START WITH AN ASSESSMENT"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      go('group');
    },
    style: {
      fontSize: 13,
      textDecoration: 'underline'
    }
  }, "Prefer training with others? Group Training \u2192"))));
}
function GroupScreen({
  go
}) {
  const {
    Button,
    ImageSlot
  } = window.ADITUSDesignSystem_884a4c;
  const A = window.ADITUS;
  const [cat, setCat] = React.useState('All');
  const C = ['All', 'Movement', 'Breath', 'Mobility', 'Recovery', 'Performance', 'Workshops'];
  const group = A.EVENTS.filter(e => e.kind === 'Group training' || e.kind === 'Workshop').filter(e => cat === 'All' || e.cat === cat);
  const how = [['Small groups', 'Up to 8 people. A coach can see everyone.'], ['Same method', 'Movement, breath and recovery — the same principles as one-to-one.'], ['Starts with an assessment', 'Fundamentals uses your priorities to set your variations.'], ['Progresses', '6-week blocks, then a check-in.']];
  const who = [['After an assessment', 'You know your priorities and want to train them with others.'], ['Moving on from Personal Training', 'You’ve built the basics one-to-one and want to keep going.'], ['Curious', 'Open sessions and workshops are the easiest way in.']];
  const half = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
    borderBottom: TR.hair
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      minHeight: 'clamp(380px,62vh,680px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: TR.hair
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Wide: small group moving together, morning, outdoors"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: TR.hair
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Close: two people laughing mid-drill"
  })), /*#__PURE__*/React.createElement(ImageSlot, {
    caption: "Coach demonstrating to a circle"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'clamp(36px,5vw,72px) var(--gutter)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))',
      gap: 28,
      alignItems: 'end',
      borderTop: TR.hair
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(48px,7vw,120px)',
      lineHeight: .86
    }
  }, "GROUP", /*#__PURE__*/React.createElement("br", null), "TRAINING"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      justifySelf: 'end',
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(20px,1.8vw,26px)',
      lineHeight: 1.2,
      letterSpacing: '-.02em'
    }
  }, "Structured ADITUS training with other people \u2014 same principles, delivered through shared sessions, workshops and group practice."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "Strength, mobility, breath, recovery and athletic practice. Up to eight people, one coach watching all of them."), /*#__PURE__*/React.createElement(Button, {
    variant: "blue",
    size: "md",
    style: {
      alignSelf: 'flex-start',
      height: 54,
      fontSize: 14
    },
    onClick: () => go('assessment')
  }, "START WITH AN ASSESSMENT")))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter) 20px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(40px,5vw,80px)'
    }
  }, "CURRENT", /*#__PURE__*/React.createElement("br", null), "SESSIONS")), /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      borderTop: TR.hair,
      borderBottom: TR.hair,
      overflowX: 'auto'
    }
  }, C.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setCat(c),
    style: {
      flex: '1 0 auto',
      minWidth: 120,
      height: 56,
      border: 0,
      borderRight: TR.hair,
      background: cat === c ? 'var(--ink)' : '#fff',
      color: cat === c ? '#fff' : 'var(--ink)',
      fontFamily: 'var(--font-display)',
      fontSize: 14
    }
  }, c.toUpperCase()))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))'
    }
  }, group.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      padding: 'var(--gutter)',
      color: 'var(--grey-700)'
    }
  }, "Nothing scheduled in this category right now."), group.map(e => {
    const req = e.req === 'After assessment';
    return /*#__PURE__*/React.createElement("article", {
      key: e.id,
      style: {
        display: 'flex',
        flexDirection: 'column',
        borderRight: TR.hair,
        borderBottom: TR.hair,
        marginRight: -1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        aspectRatio: '16/10'
      }
    }, /*#__PURE__*/React.createElement(ImageSlot, {
      caption: e.title + ' — group session, documentary'
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '18px clamp(16px,2vw,24px) 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderTop: TR.hair,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--blue)'
      }
    }, e.cat.toUpperCase()), /*#__PURE__*/React.createElement("span", {
      style: {
        padding: '2px 8px',
        background: req ? 'var(--ice)' : 'var(--mist)'
      }
    }, e.req.toUpperCase())), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        lineHeight: 1
      }
    }, e.title.toUpperCase()), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, e.desc), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--grey-700)',
        marginTop: 'auto',
        paddingTop: 10
      }
    }, e.date, " \xB7 ", e.time, " \xB7 ", e.place, " \xB7 ", A.fmt(e.price)), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm",
      full: true,
      style: {
        height: 44
      },
      onClick: () => go(req ? 'assessment' : 'community')
    }, req ? 'START WITH ASSESSMENT' : 'RESERVE A PLACE')));
  }))), /*#__PURE__*/React.createElement("section", {
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      borderRight: TR.hair
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(36px,4.4vw,64px)'
    }
  }, "HOW GROUP", /*#__PURE__*/React.createElement("br", null), "TRAINING WORKS"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--ink)'
    }
  }, how.map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'grid',
      gridTemplateColumns: '44px minmax(0,1fr)',
      gap: 12,
      padding: '14px 0',
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--blue)',
      paddingTop: 2
    }
  }, "0", i + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 19,
      fontWeight: 500
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-700)'
    }
  }, d)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      background: 'var(--grey-50)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(36px,4.4vw,64px)'
    }
  }, "WHO IT'S", /*#__PURE__*/React.createElement("br", null), "FOR"), who.map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      padding: '16px 0',
      borderTop: '1px solid var(--grey-300)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16
    }
  }, t.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, d))))), /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: TR.hair,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(min(50%,220px),1fr))'
    }
  }, ['PHOTO: BREATH SESSION — group, overhead', 'Feet workshop, close', 'Heat & cold session, steam', 'After session, people talking'].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      aspectRatio: '1/1',
      borderRight: i < 3 ? TR.hair : 0
    }
  }, /*#__PURE__*/React.createElement(ImageSlot, {
    caption: c
  })))), /*#__PURE__*/React.createElement("section", {
    style: half
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      borderRight: TR.hair
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      ...TR.h2,
      fontSize: 'clamp(36px,4.4vw,64px)'
    }
  }, "THIS MONTH"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--ink)'
    }
  }, A.EVENTS.filter(e => e.kind !== 'Event' || e.id === 'run-plunge').map(u => /*#__PURE__*/React.createElement("div", {
    key: u.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '120px minmax(0,1fr) auto',
      gap: 14,
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: TR.hair
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, u.date, " \xB7 ", u.time), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17,
      fontWeight: 500
    }
  }, u.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--grey-700)'
    }
  }, u.req.toUpperCase()))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--section-y) var(--gutter)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--ink)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(26px,2.8vw,40px)',
      lineHeight: .92
    }
  }, "FUNDAMENTALS STARTS AFTER YOUR ASSESSMENT."), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--grey-300)'
    }
  }, "Open sessions \u2014 Mobility Lab, Breath, Recovery, workshops \u2014 don't need one."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "white",
    size: "md",
    style: {
      height: 52
    },
    onClick: () => go('assessment')
  }, "START ASSESSMENT"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    size: "md",
    style: {
      height: 52
    }
  }, "VIEW OPEN SESSIONS")))));
}
Object.assign(window, {
  PersonalScreen,
  GroupScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Training.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
window.KIT_DATA = {
  cats: [['Mobility & Fascia', 'Balls, rollers and tissue tools', 5, 'sky'], ['Feet', 'Toe spacers and foot training tools', 3, 'ice'], ['Training', 'Bands, mats and movement equipment', 4, 'blue'], ['Recovery', 'Compression, heat and restoration', 3, 'periwinkle'], ['Light & Vision', 'Eyewear for daylight training and evening recovery', 2, 'navy'], ['Sleep', 'Sleep and recovery products', 2, 'periwinkle']],
  products: [{
    id: 'fascia-ball',
    name: 'Fascia Ball',
    type: 'Self-myofascial work',
    price: '₹1,200',
    cat: 'Mobility & Fascia',
    variants: ['Soft', 'Standard', 'Firm'],
    why: 'Slow, precise pressure under the foot, along the calf, around the hip — where a roller can’t reach.',
    specs: [['Material', 'EPP foam'], ['Diameter', '8 cm'], ['Weight', '28 g'], ['Care', 'Wipe clean']],
    how: ['Find the point, then stop moving.', 'Exhale and let your weight sink in.', 'Small movements. 30–90 s per point.']
  }, {
    id: 'duo-ball-08',
    name: 'Duo Ball 08',
    type: 'Spine and neck release',
    price: '₹1,900',
    cat: 'Mobility & Fascia',
    tag: 'NEW',
    variants: ['Soft', 'Standard', 'Firm'],
    why: 'Two balls joined, so you work either side of the spine without pressing on bone.',
    specs: [['Material', 'EPP foam'], ['Dimensions', '16 × 8 × 8 cm'], ['Weight', '62 g']],
    how: ['Either side of the spine.', 'Hold each point 30–90 s.', 'One segment at a time.']
  }, {
    id: 'loop-band',
    name: 'Loop Band Set',
    type: 'Loaded mobility',
    price: '₹1,800',
    cat: 'Training',
    variants: ['4-band set'],
    why: 'Just enough resistance to train control at the end of your range.',
    specs: [['Material', 'Natural latex'], ['Set', '4 resistances']],
    how: ['Anchor securely.', 'Pick a band you control at end range.', 'Slow reps beat heavy reps.']
  }, {
    id: 'toe-spacers',
    name: 'Toe Spacers',
    type: 'Foot practice',
    price: '₹2,200',
    cat: 'Feet',
    variants: ['S', 'M', 'L'],
    why: 'Shoes squash your toes together. Spacers give them room so the foot holds its shape again.',
    specs: [['Material', 'Medical-grade silicone'], ['Weight', '38 g / pair']],
    how: ['Start with 10–20 min a day.', 'Walk around at home once comfortable.', 'Pair with the Short Foot Drill.']
  }, {
    id: 'evening-amber-frames',
    name: 'Evening Amber Frames',
    type: 'Evening light management',
    price: '₹8,900',
    cat: 'Light & Vision',
    variants: ['Black', 'Tortoise'],
    why: 'Amber lenses filter blue light in the hour or two before sleep.',
    specs: [['Lens', 'Amber'], ['Frame', 'Acetate'], ['Weight', '26 g']],
    how: ['Wear for the last 1–2 h before bed.', 'Not for night driving.']
  }, {
    id: 'compression-boots',
    name: 'Compression Boots',
    type: 'Post-training recovery',
    price: '₹64,000',
    cat: 'Recovery',
    variants: ['One size'],
    why: 'Sequential compression for legs after hard blocks of training.',
    specs: [['Sizes', 'Fits 150–200 cm'], ['Battery', '4 h']],
    how: ['20–30 min after training.', 'Legs flat, relaxed.']
  }],
  events: [['Sat 17 Oct', '06:00', 'Run & Plunge', 'Carter Road, Mumbai', 'Open to all'], ['Sat 31 Oct', '09:00', 'Feet & Foundation Workshop', 'ADITUS Bandra', 'Open to all'], ['Every Wed', '18:30', 'Mobility Lab', 'ADITUS Bandra', 'Open to all'], ['Thu 15 Oct', '19:00', 'Introduction to ADITUS', 'ADITUS Bandra', 'Open to all']],
  systems: [['movement', 'MOVEMENT', ['Strength', 'Mobility', 'Biomechanics', 'Gait', 'Control']], ['breathwork', 'BREATH', ['Mechanics', 'Pressure', 'Regulation', 'Effort & recovery']], ['recovery', 'RECOVERY', ['Sleep', 'Load', 'Downregulation', 'Heat · cold · light']], ['performance', 'PERFORMANCE', ['Capacity', 'Endurance', 'Resilience', 'Sport']]],
  quiz: [{
    title: 'WHAT DO YOU WANT TO WORK ON?',
    hint: 'Pick up to three.',
    multi: true,
    opts: [['Move better', 'Range, control, fewer workarounds'], ['Get stronger', 'Carry, lift, climb'], ['Breathe better', 'Under effort and at rest'], ['Recover faster', 'Sleep, load, coming back down'], ['Do more of my sport', 'Running, climbing, racquets']]
  }, {
    title: 'HOW DO YOU WANT TO TRAIN?',
    hint: 'Pick one.',
    opts: [['One-to-one', 'Personal Training, built around you'], ['With other people', 'Group Training, small groups'], ['Not sure yet', 'We’ll suggest a starting point']]
  }, {
    title: 'ANYTHING HOLDING YOU BACK RIGHT NOW?',
    hint: 'Pick one.',
    opts: [['Nothing in particular', null], ['Niggles or old injuries', 'Something that keeps coming back'], ['Time', 'I need it to fit around work']]
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.AditusMark = __ds_scope.AditusMark;

__ds_ns.CategoryCard = __ds_scope.CategoryCard;

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.PathCard = __ds_scope.PathCard;

__ds_ns.PracticeCard = __ds_scope.PracticeCard;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.ImageSlot = __ds_scope.ImageSlot;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.SpecList = __ds_scope.SpecList;

__ds_ns.StepList = __ds_scope.StepList;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.TextLink = __ds_scope.TextLink;

__ds_ns.EmailSignup = __ds_scope.EmailSignup;

__ds_ns.OptionRow = __ds_scope.OptionRow;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.VariantSelector = __ds_scope.VariantSelector;

__ds_ns.CategoryBar = __ds_scope.CategoryBar;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.SiteNav = __ds_scope.SiteNav;

})();
