// English-only word banks. Every entry is pure Latin script (digits/symbols allowed).
import type { LangBank } from './types';

const L = (s: string): string[] => s.split('|').map(x => x.trim()).filter(Boolean);

export const EN_BANK: LangBank = {
  lists: {
    // ---------- FASHION / LUXURY ----------
    brand: L(`Margiela|Maison Margiela|Dior|Dior Homme|Christian Dior|IfSixWasNine|Number Nine|Christian Poell|Carol Christian Poell|Rick Owens|Chrome Hearts|Balenciaga|Bottega Veneta|Bottega|Saint Laurent|Celine|Prada|Miu Miu|Givenchy|Raf Simons|Helmut Lang|Yohji Yamamoto|Comme des Garcons|Junya Watanabe|Undercover|Boris Bidjan Saberi|Julius|Guidi|Ann Demeulemeester|Haider Ackermann|Jean Paul Gaultier|Vivienne Westwood|Vetements|Y Project|Enfants Riches Deprimes|Hysteric Glamour|Kapital|14th Addiction|Lad Musician|Issey Miyake|Visvim|Sacai|Alyx|Martine Rose|Bape|Stussy|Supreme|Palace|Gallery Dept|Hellstar|Denim Tears|Corteiz|Trapstar|Off White|Amiri|Loewe|Hermes|Louis Vuitton|Gucci|Fendi|Versace|Moncler|Stone Island|Acne Studios|Our Legacy|Jil Sander|Lemaire|The Row|Loro Piana|Brunello Cucinelli|Thom Browne|Marni|Mugler|Alaia|Coperni|Diesel|Moschino|Kiko Kostadinov|Craig Green|Salomon|Rimowa|Goyard|Ksubi|Purple Brand|Ed Hardy|Von Dutch|Valentino|Chanel|Burberry|Kenzo|Dolce Gabbana|Ralph Lauren|Maison Kitsune|Simone Rocha|Dries Van Noten|Walter Van Beirendonck|Ader Error|Wooyoungmi|Takahiromiyashita|Soloist|Neighborhood|Wtaps|Sasquatchfabrix|Doublet|Kolor|Needles|Orslow|Anrealage|Mastermind Japan|Roen|Goros|Lost And Found|Vlone|Raf Archive`),
    item: L(`Boots|Glasses|Jacket|Denim|Hoodie|Leather|Shades|Chain|Ring|Bag|Coat|Tabis|Derbies|Cargos|Sweater|Belt|Scarf|Cap|Gloves|Ramones|Geobaskets|Trench|Tee|Bomber|Knit|Loafers|Sneakers|Blazer|Socks|Cologne|Pendant|Beanie|Vest|Flares|Kilt|Mask|Wallet|Keychain|Runners|Slides`),
    scent: L(`Le Parfum|Sauvage|Oud Wood|Tobacco Vanille|Santal 33|Baccarat Rouge|Ombre Leather|Fahrenheit|Le Male|Spicebomb|Aventus|Bleu|Black Orchid|Lost Cherry|Replica|Gypsy Water|Another 13|Molecule 01|Tuscan Leather|Fucking Fabulous`),
    fcolor: L(`Black|Grey|Washed|Vintage|Archive|Deadstock|Distressed|Raw|Matte|Cream|Bone|Dust|Ivory|Oxblood|Midnight|Faded|Cracked|Waxed|Burnt|Acid`),
    fseason: L(`SS99|AW02|FW03|SS05|AW07|FW15|SS01|AW04|FW98|SS06|AW09|FW19|AW03|SS03`),
    fmisc: L(`Fit Check|Drip Check|Runway Walk|Front Row|Archive Fit|Head To Toe|Deadstock|Grails|Resale|Sample Size|Showroom|Lookbook|Tailored|Oversized|Layered|Dressed To Kill|Black On Black|All Black Everything|Cop Or Drop|Hype Beast|Grailed|Fashion Killa|Rare Pieces|No Logo|Logo Mania`),

    // ---------- STATUS / MONEY ----------
    sword: L(`Racks|Money|Cash|Swag|Rich|Big|Bands|Guap|Paper|Bread|Stacks|Ice|Drip|Flex|Bling|Gold|Platinum|Diamonds|Chains|Bankroll|Profit|Bag|Funds|Wealth|Luxury|Expensive|Pricey|Boss|Mogul|Kingpin|CEO|Hustle|Grind|Status|Rare|Exclusive|Millions|Billions|Commas|Zeros|Hundreds|Benjamins|Bitch|Rich Bitch|Big Boy|Big Dog|Bossed Up|Loaded|Bougie|Fancy|Lavish|Heavy|Shine|Fortune|Jackpot|Payday|Bonus|Invoice|Receipt|Tax Free|Offshore|Vault|Safe|Black Card|Centurion|Wire Transfer|Escrow|Equity|Stocks`),
    snoun: L(`Money|Cash|Racks|Bands|Ice|Chains|Bag|Diamonds|Gold|Bills|Stacks|Swag|Drip|Bitch|Whip|Wrist|Rocks|Paper|Guap|Bread`),
    sadj: L(`Big|Rich|Heavy|Fast|Dirty|Clean|Old|New|Blue|Long|Easy|Real|Expensive|Cold|Quick|Stupid|Crazy|Silent|Fresh|Foreign`),
    sphrase: L(`Rich Forever|Money Talk|Cash Out|Count It Up|Blue Faces|All Gold Everything|Big Steppa|No Budget|Pay Me|Gettin Money|Ice On My Wrist|New Money|Old Money|Bag Secured|Too Rich|Rich Off Pain|Stack It Up|Money Long|Racks On Racks|Big Bag|Cash Rules|Money Calls|Expensive Taste|Price Tag|Rich Kid Syndrome|Born Rich|Made Men|Paid In Full|Bank Run|Big Business|Cash Only|Dont Need Your Money|Money Over Love|Rich And Lonely|Spend It|Blow It All|Pockets Heavy|Wrist Froze|Diamonds Dancing|Swag Surfing|Big Spender|Million Dollar Mood|Cheque Please|Keep The Change|Rich Bitch Energy|Money Makes Me Sad|Broke Again|From Broke To Rich`),

    // ---------- RELATIONS ----------
    rword: L(`Toxic|Jealous|Hate|Broken|Love|Lover|Liar|Fake|Ex|Ghosted|Cheater|Loyal|Loyalty|Trust|Promise|Forever|Never|Sorry|Alone|Stay|Leave|Cold|Numb|Obsessed|Crush|Heartless|Mine|Yours|Babe|Baby|Darling|Situationship|Red Flags|Exes|Fance|Whatever|Unloved|Lovesick|Clingy|Distant|Replaced|Blocked|Unfollowed|Pretend|Sweetheart|Valentine|Honey|Darlin|Envy|Betrayal|Devotion|Closure`),
    radj: L(`Toxic|Jealous|Broken|Fake|Cold|Bad|Sweet|Crazy|Lonely|Pretty|Silent|Real|Secret|Wrong|Perfect|Stupid|Lost|Hollow|Little|Dirty`),
    rnoun: L(`Love|Heart|Lover|Kiss|Promise|Text|Call|Ex|Girl|Boy|Eyes|Lies|Romance|Affair|Feelings|Habit|Games|Touch|Goodbye|Valentine`),
    rphrase: L(`Stay With Me|Miss U|Hate U|Love U Less|Dont Call Me|Text Me Back|Left On Read|Not Your Type|Same Mistakes|Cold Shoulder|I Dont Care|Who Cares|Its Over|Not Again|Just Friends|Mixed Signals|Two Faces|Fake Love|Real Love|No Love|Love Bomb|Pretty Liar|You Lied|Dont Leave|Please Stay|Run Back|Come Back|Never Yours|Only Mine|Ex Files|3AM Texts|Delete My Number|Say Less|Lowkey Love|Jealous Type|Ride Or Die|Loyal To Nobody|Trust Issues|Love Language|Breakup Season|No Feelings|Catch Feelings|Ice Cold Heart|You Again|Okay Bye|Cute But Psycho|Mutual Hate|Same Old Love|Love Me Harder|I Hate That I Love You|Dont Text Him|Your Perfume|My Hoodie On You|Still Got Your Photos|You Deserve Better|We Were Never|Not A Love Song|Love Is Overrated|Thanks For Nothing|Happy For You|Good Luck With Him|Call Me When Hes Gone|Toxic But Cute|Romance Is Dead|Lover Not A Fighter|Kiss Me Like You Mean It|Unread Messages|Seen At 2AM|Pick Up The Phone|Dont Be Jealous|Loyalty Test|Heart On Airplane Mode`),

    // ---------- VIBE / MOOD ----------
    vword: L(`Happy|Sad|Funny|Euphoria|Joy|Bliss|Chill|Lazy|Sunny|Gloomy|Mellow|Hyper|Dizzy|Giddy|Silly|Moody|Dreamy|Hazy|Calm|Wild|Crazy|Goofy|Sleepy|Lit|Vibes|Good Mood|Bad Mood|Mood Swing|Smile|Laugh|Daydream|Sunshine|Golden Hour|Blue Hour|Slow Motion|Feel Good|Summer Rain|Butterflies|Serotonin|Dopamine|LOL|Ha Ha|Cloud Nine|Sugar Rush|Bubblegum|Weightless|Floating|Lucid|Carefree|Cozy|Warm|Fuzzy|Pastel|Sparkle|Confetti|Giggles|Breezy|Vacation|Good Days|Easy Sunday|Fresh Air|Free|Dance|Bounce|Groove|Chill Pill|Peace|Zen|Glow|Glow Up|Main Character`),

    // ---------- SAD ----------
    sadword: L(`Sad|Tears|Cry|Crying|Blue|Lonely|Empty|Numb|Rain|Grey|Heavy|Sorrow|Melancholy|Lost|Gone|Goodbye|Farewell|Hollow|Faded|Winter|November|Silence|Echo|Ashes|Regret|Why|Alone Again|Cry Baby|Sad Boy|Sad Girl|Tears In Rain|Rain On My Face|Empty Room|Cold Wind|Heartache|Nobody Home|Last Goodbye|Grey Skies|Quiet Pain|Missing You|Crying In The Club|Lonely Nights|Pillow Tears|Too Late|Fade Away|Lost Again|Gone Too Soon|Rainy Days|Wet Pillow|Blue Lights|Cold Hands|Tired|So Tired|Drained|Nothing Left|Unspoken|Wish You Were Here|Sad Song|Tears On The Dashboard|Sad In Paris|Cry Alone|Sorry Mom|Old Photos|Hospital Lights|Last Summer|Empty Seats|Broken Glass`),

    // ---------- NUMBERS ----------
    num: L(`Seven|Five|Le Four|Three|Nine|Eleven|Twelve|Zero|One|Two|Six|Eight|Ten|13|99|777|444|1999|2002|3AM|4AM|24/7|365|101|808|Twice|Double|Triple|Thirteen|Twenty One|Forty Four|Hundred|Infinity|Number One|Seventeen|Sixteen|Nineteen|Fifty|1000|00`),
    numw: L(`Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Hundred|Thousand|Million|Forty|Ninety Nine`),
    numpl: L(`Days|Nights|Times|Lives|Rings|Calls|Shots|Floors|Seconds|Minutes|Kisses|Lies|Chances|Tears|Ways|Miles|Reasons|Steps|Sins|Rounds|Bullets|Roses|Texts|Summers|Winters|Scars`),
    ord: L(`First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Last|Thirteenth`),
    ordn: L(`Attempt|Floor|Chance|Round|Wave|Life|Sin|Kiss|Call|Night|Day|Try|Heaven|Dimension|Sense|Date|Lesson|Wonder|Rule|Shot`),
    numfr: L(`Un|Deux|Trois|Quatre|Cinq|Six|Sept|Huit|Neuf|Dix|Four`),
    digits: L(`7|13|21|44|77|101|404|808|999|1017|23|11|9|5|112|305|212|17`),
    numplace: L(`Room|Floor|Gate|Flight|Track|Exit|Apartment|Locker|Seat|Area|Block|Suite`),

    // ---------- CARS / WEAPONS / BRANDS ----------
    car: L(`AMG|Bentley|Mercedes|Benz|G Wagon|G63|Escalade|Maybach|Rolls Royce|Cullinan|Phantom|Lambo|Urus|Aventador|Ferrari|Porsche|911|GT3|Cayenne|Range Rover|McLaren|Bugatti|Koenigsegg|Pagani|Aston Martin|Viper|Hellcat|Charger|Corvette|Mustang|Supra|Skyline|GTR|M5|M3|R8|RS6|Tesla|Cybertruck|Hummer|Bentayga|Spider|Coupe|Ducati|Kawasaki|R1|Trackhawk|Testarossa|Huracan|Murcielago|SF90|LaFerrari|Senna|Chiron|Wraith|Dawn|Ghost|Sprinter|Maybach 62|E Class|S Class|CLS|SLR|Brabus`),
    weapon: L(`Glock|Glock19|Glock 17|Draco|AK47|AR15|M4A1|Uzi|Mac 10|Tec 9|Desert Eagle|Deagle|Beretta|Shotgun|Sniper|9mm|Chopper|Stick|Pump|Revolver|Colt|Katana|Switchblade|Grenade|Kalash|Kalashnikov|Thirty Clip|Drum|Laser|Silencer|Bulletproof|Kevlar|MP5|P90|AWP|Scar|Famas|Magnum`),
    life: L(`OnlyFans|Coca Cola|Pepsi|Red Bull|Monster Energy|Radisson|Reddison|Ritz Carlton|Four Seasons|Chateau Marmont|Waldorf|Hilton|Airbnb|Uber Black|Netflix|Instagram|TikTok|Telegram|iPhone|PlayStation|Nintendo|Rolex|Patek|Audemars|Richard Mille|Cartier|Tiffany|Van Cleef|Moet|Dom Perignon|Cristal|Ace Of Spades|Hennessy|Henny|Patron|Don Julio|Casamigos|Grey Goose|Belvedere|Jack Daniels|Marlboro|Marlboro Red|Parliament|Camel|Davidoff|Cohiba|Lucky Strike|Vogue Slims|Nobu|Erewhon|Starbucks|McDonalds|Popeyes|Amex|Bitcoin|Ethereum|Binance|Apple Pay|Louis XIII|Soho House|Bulgari Hotel|Aman|Burj Al Arab|Plaza Hotel|Mandarin Oriental|Emirates|First Class|Private Jet|NetJets|Gulfstream|Yacht Week|Monaco GP|Coachella|Met Gala|Wall Street|Las Vegas Strip|Bellagio|Caesars Palace`),
    drink: L(`Hennessy|Henny|Patron|Don Julio|Casamigos|Grey Goose|Belvedere|Moet|Dom Perignon|Cristal|Ace Of Spades|Jack Daniels|Red Bull|Coca Cola|Louis XIII|Clase Azul|Macallan|Johnnie Blue`),
    cig: L(`Marlboro|Marlboro Red|Parliament|Camel|Davidoff|Cohiba|Lucky Strike|Vogue Slims|Dunhill|Kent|Winston|Sobranie`),
    hotel: L(`Ritz|Four Seasons|Chateau Marmont|Waldorf|Radisson|Hilton|Aman|Bulgari Hotel|Plaza|Mandarin Oriental|Soho House|Bellagio|Burj Al Arab|Savoy|Marriott`),
    carsuf: L(`Doors|Keys|Seats|Music|Dreams|Lights|Mode|Season|Talk|Gang|Life|Money|Engine|Speed|Paint|Rims`),

    // ---------- BODY / DARK ----------
    dword: L(`Shit|Ugly|Fuck|Pain|Blood|Kill|Idols|Monster|Vampire|Overdose|Broken|Scars|Needles|Bones|Shadow|Ghost|Fear|Psychosis|Pills|Xanax|Percs|Lean|Codeine|Molly|Powder|Syringe|Bleach|Rot|Decay|Flesh|Skin|Teeth|Skull|Corpse|Coffin|Funeral|Grave|Morgue|Autopsy|Bruise|Wound|Infection|Fever|Vomit|Nausea|Insomnia|Paranoia|Withdrawal|Relapse|Detox|Rehab|Self Destruct|Bleed|Bleeding|Choke|Sick|Disease|Virus|Plague|Dead Inside|Hole|Pus|Tumor|Stitches|Surgery|Anesthesia|Morphine|Adrenaline|Cyanide|Arsenic|Tetanus|Rabies|Ugly Truth|Kill Your Idols|Monster Inside|Fuck It|Pain Killer|Bloodstream|Bloodbath|Skin And Bones|Death Wish|Six Feet Under|Body Bag|Bad Trip|Pill Box|Needles In My Skin|Blood Money|Cold Blood|Black Lungs|Rotten Teeth|Hollow Bones|Shit Happens|Ugly Inside|Ghost In My Veins|Vampire Kiss|Overdose On You|Fear Of Myself`),
    dadj: L(`Cold|Rotten|Black|Sick|Dead|Broken|Ugly|Toxic|Hollow|Bloody|Pale|Numb|Burnt|Infected|Bruised|Twisted|Wicked|Poisoned`),
    dnoun: L(`Blood|Bones|Skin|Lungs|Teeth|Heart|Veins|Eyes|Hands|Mind|Soul|Body|Flesh|Skull|Ribs|Wounds|Scars|Smile`),
    drug: L(`Xanax|Percs|Lean|Codeine|Molly|Pills|Morphine|Adrenaline|Powder`),
    drugsuf: L(`Dreams|Season|Diet|Kisses|Heaven|Talk|Baby|Love|Nights|Summer`),

    // ---------- MYSTIC ----------
    mword: L(`Demon|Angel|Rascal|Devil|Saint|Sinner|Halo|Hellfire|Seraph|Lucifer|Eden|Purgatory|Limbo|Abyss|Void|Eclipse|Omen|Ritual|Hex|Curse|Spell|Witch|Oracle|Prophecy|Apocalypse|Rapture|Exorcism|Pentagram|Crucifix|Chapel|Cathedral|Nephilim|Wraith|Banshee|Specter|Phantom|Moonchild|Starchild|Astral|Nirvana|Karma|Samsara|Mantra|Tarot|Crystal|Elysium|Valhalla|Requiem|Sabbath|Gargoyle|Cherub|Archangel|Incubus|Succubus|Golem|Reaper`),
    madj: L(`Fallen|Holy|Unholy|Dark|Black|White|Crying|Sleeping|Burning|Silent|Wicked|Lost|Little|Broken|Bleeding|Sacred|Cursed|Haunted|Divine|Lonely`),
    msubj: L(`Angels|Demons|Ghosts|Saints|Fallen stars|Black cats|Witches|Dead poets|Little demons|Sinners|Rascals|Vampires|My angels|Shadows`),
    mverb: L(`cry|dance|whisper|bleed|pray|burn|sleep|fall|scream|smoke|drown|laugh|kiss|hide|wait|sing`),
    mplace: L(`in the mirror|under the rain|in my room|in the ocean|in Paris|in the chapel|in a cold car|in the dark|in the club|in the void|in my head|on the roof|at 4AM|in Tokyo|behind the curtain|under my bed|in the backseat|on the dancefloor|in black water|inside the TV`),
    mlong: L(`Im a rascal surfer in a ocean of blood|You broke me down I built myself up|AW02 angel cry|Demon inside my shadow|Walking through the valley of chrome|No soul left in the system|Ghosts in the machine|Angels dont cry in Paris|I sold my halo for a hoodie|Heaven has no WiFi|The devil wears Margiela|Burning churches in my dreams|I talk to ghosts at 4AM|Fallen angel with a broken wing|My demons know my name|Born in hell raised by angels|Cry me a river of gasoline|Bleeding stars over Tokyo|Halo made of barbed wire|Saints and sinners at the same party|I saw god in a parking lot|The moon is watching me|Lucid dreams in a cold room|Purgatory is a waiting room|Kiss me before the apocalypse|Rascal angel on a black horse|Holy water in my double cup|Seven demons one heart|Somewhere between heaven and a hangover|Forever is a lie the angels told|Pray for me when the lights go out|I was a ghost before I was famous|Crying angels in a velvet room|Black wings white lies|Nobody prays for the villain|Angel number 444|Wake up in another dimension|Under the skin of the moon|Witches on the rooftop|My shadow drinks my coffee|God is a DJ tonight|Dancing on my own grave|Halo slipping off my head|The angel in the backseat|Lucifer left me on read`),

    // ---------- AESTHETICS ----------
    city: L(`Paris|Tokyo|Milan|Milano|Berlin|London|Seoul|Shibuya|Harajuku|Ginza|SoHo|Brooklyn|Manhattan|Antwerp|Copenhagen|Stockholm|Florence|Monaco|Nice|Cannes|St Tropez|Ibiza|Mykonos|Capri|Portofino|Amalfi|Lake Como|Zurich|Geneva|Vienna|Prague|Barcelona|Madrid|Lisbon|Dubai|Abu Dhabi|Doha|Hong Kong|Shanghai|Singapore|Bangkok|Bali|Tulum|Mexico City|Miami|LA|Los Angeles|Malibu|Calabasas|Beverly Hills|Las Vegas|NYC|Atlanta|Toronto|Rio|Marrakech|Istanbul|Tbilisi|Riga|Oslo|Reykjavik|Osaka|Kyoto|Saint Barth|Courchevel|Aspen|Positano|Sardinia|Marbella`),
    fw: L(`Runway|Catwalk|Front Row|Backstage|Couture|Haute Couture|Atelier|Lookbook|Editorial|Vogue|Muse|Model|Supermodel|Silhouette|Velvet|Silk|Satin|Cashmere|Leather|Lace|Chrome|Neon|Pearl|Gloss|Glitter|Glam|Glamour|Fashion Week|Avant Garde|Minimal|Monochrome|Archive|Vintage|Y2K|Mood Board|Flash|Paparazzi|Spotlight|Cover Shoot|Fitting Room|Showroom|Boutique|Penthouse|Aesthetic|Elegance|Haute|Noir|Rouge|Blanc|Champagne|Marble|Gold Leaf`),
    time: L(`Midnight|4AM|5AM|Sunset|Sunrise|Golden Hour|Blue Hour|Twilight|Dusk|Dawn|Late Night|After Hours|Weekend|Friday Night|Sunday Morning|Summer 99|Winter 03|Spring|Autumn|December|August|2000s|Last Night|Tonight|Forever|Monday|New Years Eve|Rush Hour`),

    // ---------- ABSURD ----------
    aadj: L(`Plastic|Flying|Dancing|Crying|Sleepy|Angry|Haunted|Electric|Inflatable|Radioactive|Lonely|Invisible|Drunk|Tiny|Giant|Vegan|Frozen|Glitter|Rubber|Melting|Sad|Rich|Bald|Spicy|Confused`),
    anoun: L(`Duck|Toaster|Bear|Hamster|Pigeon|Banana|Fridge|Penguin|Spaghetti|Cactus|Llama|Sandwich|Goldfish|Dinosaur|Microwave|Shrimp|Sock|Potato|Giraffe|Lasagna|Raccoon|Frog|Goose|Cucumber|Dumpling|Grandma|Slipper|Hobo|Castle|Garbage`),
    aphrase: L(`My Cat Pays Rent|Shrimp Has A Mortgage|Taxes For Penguins|Grandma At The Rave|Goose In Prada|Pigeon With A Visa|Raccoon In Balenciaga|Banana Phone|Spaghetti Western|Toaster Bath|Duck Season|Microwave Love|Sock Puppet Mafia|Potato Royalty|Frog Prince Of Brooklyn|Dinosaur Taxi`),

    // ---------- CONCEPTUAL ----------
    cword: L(`Manifesto|Metaphysics|String Theory|Abstract Zero|Post Irony|Deconstruction|Entropy|Paradox|Simulacra|Hyperreality|Nihilism|Existential|Zeitgeist|Tabula Rasa|Ego Death|Placebo|Algorithm|Dopamine Economy|Late Capitalism|Blank Canvas|Negative Space|White Cube|Ready Made|Thesis|Antithesis|Synthesis|Ontology|Uncanny Valley|Cognitive Dissonance|Free Will|Determinism|Butterfly Effect|Occams Razor|Schrodinger|Absurdism|Memento Mori|Vanitas|Panopticon|Institutional Crisis|Black Square|Human Error|Dead Internet|Main Character Syndrome|Beta Version|Infinite Scroll`),
    cnum: L(`01|02|03|II|III|IV|0.1|2.0|25|99|X|Zero`),

    // ---------- RAP / TRAP ----------
    rap: L(`Prime Rap|Street Flow|Four Quarters|Beat And Bass|Pure Rap|Rhymes And Punches|Ghetto Gospel|Bars|Punchline|Freestyle|Cypher|Verse|Flow|Hook|Adlibs|Boom Bap|Mic Check|One Take|No Hook|Real Rap|Street Poetry|Block Party|Corner Store|Hood Tales|Trenches|Big Steppa|Day One|OG|Underdog|Goat Talk|Respect|Legacy|Crown|Throne|King Of The Block|Testimony|Gospel|Sermon|Paper Route|Grind Season|From The Bottom|Battle Bars|Diss Track|Old School|New School|Hunger|Still Hungry|No Features|Rap God Complex|Ink And Paper`),
    trap: L(`Trap House|Dirty Bass|Drift Mode|Street Lights|Mosquito|Gang Shit|Jump Out|Flex Season|Slatt|Pull Up|Skrrt|Opps|Smoke|Sticks|Drill|Shiesty|Plug Talk|Bando|Lean Season|808|Bounce Out|No Smoke|Slide|Gang Gang|Brr|Juggin|Trappin|Sauce|Sauce Walk|Choppa Style|Hellcat Mode|Rage|Mosh Pit|Vamp|Slime|Go Crazy|Woah|Yeah Yeah|Tint|Double Cup|Glizzy|Red Dot|Hood Rich|Foreign`),

    // ---------- EXTRA (used in Mix) ----------
    talk: L(`missed call|read receipts|left on read|wrong number|late checkout|flight mode|do not disturb|hotel lobby|bad timing|out of pocket|no service|too fast|still up|different league|private jet|tinted windows|cash only|no witnesses|change my number|same old story|first class|ghost town|cold brew|backseat|last flight|burner phone|rent free|off the radar|zero tolerance|midnight call|speed dial|wrong exit|save the draft|two missed calls|see you friday|noise complaint|elevator music|off the clock|no receipt|voice memo|spare key|exit only|low battery|airplane mode|location off|plus one|after party|room service|valet parking|guest list|last call`),
    celeb: L(`Tarantino|Cobain|Bowie|Al Pacino|Scarface|Bruce Wayne|Gotham|Keanu|Matrix|Kill Bill|Monroe|Messi|Jordan|Pulp Fiction|Miami Vice|Don Corleone|Blade Runner|Tyson|Gatsby|Kobe|DiCaprio|Coppola|Ayrton Senna|Kubrick|Lynch|Basquiat|Warhol|Kate Moss|Naomi|Patrick Bateman|Tony Montana|Joker|John Wick|Neo|Lara Croft|Kurt|Elvis|Marilyn`),
    slang: L(`No Cap|Lowkey|Highkey|Drip|Aura|Glitch|Flex|Ghosting|Backstage|Afterparty|Side Quest|Main Character|Bankroll|Motion|Pressure|Switch Up|Cash Out|Off Grid|No Signal|Prime Time|Heavy Rotation|On Sight|Deadstock|VIP Only|Rizz|Delulu|Slay|Ate|Bet|Fr Fr|Its Giving|Vibe Check|Gatekeep|Era|Core`),
    digital: L(`Track 11|Tape 09|Error 404|Clipped Master|Raw Stem|Vinyl Crackle|808 Therapy|Aux Cord|B Side|Subwoofer|White Noise|Mono Mix|Freq 432|Voice Note|Demo Final Final|Bounce 3|Untitled|Unreleased|Leak|Sample Pack|Low Pass|Sidechain|Autotune|Bitcrush|Reverb Tail`),
    punch: L(`Kerosene|Velvet|Mirage|Ricochet|Voltage|Monolith|Static|Solstice|Vortex|Cyanide|Phantom|Parallax|Catalyst|Obsidian|Vertigo|Mercury|Telemetry|Cascade|Kinetic|Silencer|Blueprint|Pendulum|Silhouette|Valhalla|Frequency|Ozone|Overcast|Headline|Gasoline|Napalm|Adrenaline|Nicotine|Sapphire|Titanium|Graphite|Magnolia|Lavender|Avalanche|Tsunami|Hurricane|Daylight|Moonlight|Paradise|Sirens|Anthem|Riot|Ozempic|Stardust|Carbon|Cobalt`)
  },

  themes: {
    fashion: [['{brand}', 3], ['{brand} {item}', 4], ['{brand} On Me', 1.1], ['{brand} Type', 1.1], ['{brand} Type Shit', 0.5], ['{scent} On Me', 0.8], ['{fcolor} {brand}', 0.9], ['{fcolor} {item}', 0.7], ['Archive {brand}', 0.7], ['{fseason} {brand}', 0.7], ['{brand} {fseason}', 0.5], ['Dressed In {brand}', 0.5], ['{brand} Girl', 0.5], ['{brand} Kid', 0.4], ['{city} {brand}', 0.4], ['{fmisc}', 1.4], ['{brand} And {brand}', 0.4]],
    status: [['{sword}', 4.5], ['{sadj} {snoun}', 2.5], ['{sphrase}', 3], ['{snoun} {snoun}', 0.9], ['{snoun} {snoun} {snoun}', 0.5], ['{snoun} Talk', 0.6], ['{snoun} On Me', 0.7], ['{snoun} Up', 0.5], ['Too {sadj}', 0.4], ['{snoun} And {snoun}', 0.5], ['{sadj} {snoun} Bitch', 0.25]],
    relations: [['{rword}', 4], ['{rphrase}', 5], ['{radj} {rnoun}', 3], ['{rword} {rword}', 0.4], ['No More {rnoun}', 0.4], ['Your {rnoun}', 0.5]],
    vibe: [['{vword}', 5], ['{vword} {vword}', 0.6], ['{time} {vword}', 0.6]],
    sad: [['{sadword}', 6], ['{sadword} In {city}', 0.4], ['{time} {sadword}', 0.4]],
    numbers: [['{num}', 3], ['{numw} {numpl}', 3], ['{ord} {ordn}', 2.5], ['Le {numfr}', 1], ['{numplace} {digits}', 1.4]],
    cars_weapons: [['{car}', 2.6], ['{weapon}', 1.5], ['{life}', 2.6], ['{car} {carsuf}', 1.4], ['{weapon} On Me', 0.6], ['{life} Money', 0.4], ['{life} Girl', 0.4], ['Pull Up In A {car}', 0.5], ['Sippin {drink}', 0.6], ['Check In {hotel}', 0.4], ['Room At The {hotel}', 0.3], ['{car} And {weapon}', 0.3], ['{drink} And {cig}', 0.4], ['{car} {weapon}', 0.25]],
    body_dark: [['{dword}', 5], ['{dadj} {dnoun}', 2.2], ['{dnoun} And {dnoun}', 0.5], ['{drug} {drugsuf}', 0.8]],
    mystic: [['{mword}', 3], ['{madj} {mword}', 2.5], ['{mlong}', 2.5], ['{msubj} {mverb} {mplace}', 2.2], ['{mword} {digits}', 0.4], ['{mword} And {mword}', 0.4]],
    aesthetics: [['{city}', 3], ['{fw}', 3], ['{time}', 1.6], ['{city} {fw}', 1.8], ['{fw} In {city}', 1], ['{time} In {city}', 1.4], ['{city} At {time}', 0.9], ['Last Night In {city}', 0.5], ['Flight To {city}', 0.6], ['{city} {fseason}', 0.4], ['{city} To {city}', 0.4]],
    absurd: [['{aadj} {anoun}', 4], ['{aphrase}', 2], ['{anoun}', 0.6]],
    conceptual: [['{cword}', 5], ['{cword} {cnum}', 1.5]],
    rap: [['{rap}', 5]],
    trap: [['{trap}', 5], ['{trap} {trap}', 0.4]],
    real_talk: [['{talk}', 5]],
    celebs: [['{celeb}', 4], ['{celeb} Energy', 0.6], ['{celeb} Type', 0.4]],
    slang: [['{slang}', 5]],
    digital: [['{digital}', 5]],
    punch: [['{punch}', 5]]
  },

  sprinkle: L(`7|99|Five|24/7|x3|2AM|777|Pt 2|13|Seven`),
  albumTags: L(`Vol 1|Vol 2|Deluxe|Tape|Archive|Sessions|Chapter One|The Album|Reloaded|Side A`)
};
