
const CATEGORIES = [
    {
        id: '植物',
        name: '§x§F§F§0§0§0§0⚡ §x§F§F§A§5§0§0植§x§F§F§D§7§0§0物 §x§3§C§A§F§F§F⚡',
        lore: '§x§F§F§B§6§C§1❀ §x§F§F§B§6§C§1全部树苗、花草、农作物 §x§C§D§5§B§9§9❀',
        icon: 'OAK_SAPLING',
        slot: 10
    }
];

const MAIN_TITLE = '§x§7§7§f§7§f§f协§x§6§0§f§a§d§a议§x§4§9§f§d§b§5内§x§6§3§f§f§9§3容§x§b§0§f§f§7§5：§x§f§c§f§f§5§7植物';
const SHOP_LISTENER_KEY = 'gltcEnergyShop_植物';

const BORDER_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 17, 18, 26, 27, 35, 36, 44, 45, 46, 47, 51, 52, 53];
const PAGE_SIZE = 28;
const ITEM_SLOTS = [10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43];
const PREV_SLOT = 48;
const NEXT_SLOT = 50;

const ITEM_NAMES = {
    OAK_SAPLING: '橡树树苗', SPRUCE_SAPLING: '云杉树苗', BIRCH_SAPLING: '白桦树苗',
    JUNGLE_SAPLING: '丛林树苗', ACACIA_SAPLING: '金合欢树苗', DARK_OAK_SAPLING: '深色橡树苗',
    CHERRY_SAPLING: '樱花树苗', MANGROVE_PROPAGULE: '红树胎生苗', AZALEA: '杜鹃花丛',
    FLOWERING_AZALEA: '盛开的杜鹃花丛', CRIMSON_FUNGUS: '绯红菌', WARPED_FUNGUS: '诡异菌',
    POPPY: '虞美人', DANDELION: '蒲公英', BLUE_ORCHID: '兰花',
    ALLIUM: '绒球葱', AZURE_BLUET: '滨菊', OXEYE_DAISY: '滨菊',
    CORNFLOWER: '矢车菊', RED_TULIP: '红色郁金香', ORANGE_TULIP: '橙色郁金香',
    WHITE_TULIP: '白色郁金香', PINK_TULIP: '粉红色郁金香', LILY_OF_THE_VALLEY: '铃兰',
    SUNFLOWER: '向日葵', LILAC: '丁香', ROSE_BUSH: '玫瑰丛', PEONY: '牡丹',
    PITCHER_PLANT: '瓶子草', TORCHFLOWER: '火把花', PINK_PETALS: '粉红色花簇',
    CHORUS_FLOWER: '紫颂花', SPORE_BLOSSOM: '孢子花', WITHER_ROSE: '凋零玫瑰',
    BROWN_MUSHROOM: '棕色蘑菇', RED_MUSHROOM: '红色蘑菇',
    WHEAT_SEEDS: '小麦种子', PUMPKIN_SEEDS: '南瓜种子', MELON_SEEDS: '西瓜种子',
    BEETROOT_SEEDS: '甜菜种子', TORCHFLOWER_SEEDS: '火把花种子', PITCHER_POD: '瓶子草荚果',
    NETHER_WART: '下界疣', COCOA_BEANS: '可可豆',
    CARROT: '胡萝卜', POTATO: '马铃薯', WHEAT: '小麦', BEETROOT: '甜菜根',
    APPLE: '苹果', MELON_SLICE: '西瓜片', PUMPKIN: '南瓜', MELON: '西瓜',
    SWEET_BERRIES: '甜浆果', GLOW_BERRIES: '发光浆果', BAMBOO: '竹子',
    SUGAR_CANE: '甘蔗', CACTUS: '仙人掌', SEA_PICKLE: '海泡菜',
    CHORUS_FRUIT: '紫颂果',
    SHORT_GRASS: '矮草丛', TALL_GRASS: '高草丛', FERN: '蕨', LARGE_FERN: '大型蕨',
    VINE: '藤蔓', LILY_PAD: '睡莲', MOSS_BLOCK: '苔藓块', MOSS_CARPET: '苔藓地毯',
    BIG_DRIPLEAF: '大型垂滴叶', SMALL_DRIPLEAF: '小型垂滴叶', GLOW_LICHEN: '发光地衣',
    HANGING_ROOTS: '垂根', SEAGRASS: '海草', KELP: '海带',
    OAK_LEAVES: '橡树树叶', SPRUCE_LEAVES: '云杉树叶', BIRCH_LEAVES: '白桦树叶',
    JUNGLE_LEAVES: '丛林树叶', ACACIA_LEAVES: '金合欢树叶', DARK_OAK_LEAVES: '深色橡树叶',
    CHERRY_LEAVES: '樱花树叶', MANGROVE_LEAVES: '红树树叶',
    AZALEA_LEAVES: '杜鹃树叶', FLOWERING_AZALEA_LEAVES: '盛开的杜鹃树叶',
    CRIMSON_ROOTS: '绯红菌索', WARPED_ROOTS: '诡异菌索',
    WEEPING_VINES: '垂泪藤', TWISTING_VINES: '缠怨藤',
    MANGROVE_ROOTS: '红树根', DEAD_BUSH: '枯死的灌木'
};

const ITEMS = {
    植物: [
        { type: 'vanilla', id: 'OAK_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'SPRUCE_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'BIRCH_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'JUNGLE_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'ACACIA_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'DARK_OAK_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'CHERRY_SAPLING', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'MANGROVE_PROPAGULE', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'AZALEA', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'FLOWERING_AZALEA', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'CRIMSON_FUNGUS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'WARPED_FUNGUS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'POPPY', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'DANDELION', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'BLUE_ORCHID', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'ALLIUM', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'AZURE_BLUET', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'OXEYE_DAISY', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'CORNFLOWER', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'RED_TULIP', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'ORANGE_TULIP', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'WHITE_TULIP', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'PINK_TULIP', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'LILY_OF_THE_VALLEY', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'SUNFLOWER', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'LILAC', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'ROSE_BUSH', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'PEONY', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'PITCHER_PLANT', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'TORCHFLOWER', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'PINK_PETALS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'CHORUS_FLOWER', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'SPORE_BLOSSOM', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'WITHER_ROSE', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'BROWN_MUSHROOM', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'RED_MUSHROOM', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'WHEAT_SEEDS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'PUMPKIN_SEEDS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'MELON_SEEDS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'BEETROOT_SEEDS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'TORCHFLOWER_SEEDS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'PITCHER_POD', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'NETHER_WART', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'COCOA_BEANS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'CARROT', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'POTATO', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'WHEAT', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'BEETROOT', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'APPLE', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'MELON_SLICE', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'PUMPKIN', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'MELON', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'SWEET_BERRIES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'GLOW_BERRIES', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'BAMBOO', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'SUGAR_CANE', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'CACTUS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'SEA_PICKLE', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'CHORUS_FRUIT', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'SHORT_GRASS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'TALL_GRASS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'FERN', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'LARGE_FERN', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'VINE', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'LILY_PAD', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'MOSS_BLOCK', price: [{ id: 'AL_A3', amount: 12 }] },
        { type: 'vanilla', id: 'MOSS_CARPET', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'BIG_DRIPLEAF', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'SMALL_DRIPLEAF', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'GLOW_LICHEN', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'HANGING_ROOTS', price: [{ id: 'AL_A3', amount: 6 }] },
        { type: 'vanilla', id: 'SEAGRASS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'KELP', price: [{ id: 'AL_A3', amount: 2 }] },
        // 树叶类（1→1）
        { type: 'vanilla', id: 'OAK_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'SPRUCE_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'BIRCH_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'JUNGLE_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'ACACIA_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'DARK_OAK_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'CHERRY_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'MANGROVE_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'AZALEA_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'FLOWERING_AZALEA_LEAVES', price: [{ id: 'AL_A3', amount: 2 }] },
        // 菌索/藤蔓/其他（1→1）
        { type: 'vanilla', id: 'CRIMSON_ROOTS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'WARPED_ROOTS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'WEEPING_VINES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'TWISTING_VINES', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'MANGROVE_ROOTS', price: [{ id: 'AL_A3', amount: 2 }] },
        { type: 'vanilla', id: 'DEAD_BUSH', price: [{ id: 'AL_A3', amount: 2 }] }
    ]
};

const Bukkit = Java.type('org.bukkit.Bukkit');
const Material = Java.type('org.bukkit.Material');
const ItemStack = Java.type('org.bukkit.inventory.ItemStack');
const ClickEvent = Java.type('org.bukkit.event.inventory.InventoryClickEvent');
const CloseEvent = Java.type('org.bukkit.event.inventory.InventoryCloseEvent');
const EventPriority = Java.type('org.bukkit.event.EventPriority');
const plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
const SlimefunItem = Java.type('io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem');
const Listener = Java.type('org.bukkit.event.Listener');

// ---- 信用点系统 ----
var File = java.io.File;var Files = java.nio.file.Files;var StandardCharsets = java.nio.charset.StandardCharsets;var NamespacedKey = Java.type('org.bukkit.NamespacedKey');var PersistentDataType = Java.type('org.bukkit.persistence.PersistentDataType');var _plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;var DATA_DIR = new File(_plugin.getDataFolder().getAbsolutePath() + '/addon_configs/GLTC/玩家属性/信用点');if (!DATA_DIR.exists()) DATA_DIR.mkdirs();var CARD_OWNER_KEY = new NamespacedKey('gltc', 'card_owner');var SF_ITEM_KEY = new NamespacedKey('slimefun', 'slimefun_item');var CARD_ID = 'GLTC_银行卡';var EXCHANGE_RATES = {'AL_A1':1,'AL_A2':1,'AL_A3':1,'AL_A4':1,'AL_A5':1,'AL_A6':1,'AL_B1':2,'TSTL':2,'TSSY':2,'TSG':2,'TSHH':3,'TSYY':3,'TSBD':3,'TSTLS':3,'TSND':3,'TSJJ':3,'TSGD':3,'TSXT':3,'TSTJ':4,'TSDBG':4,'TSBTL':4,'TSJLD':4,'TSYM':4,'TSLD':4,'TSYD':4,'TSDD':4,'TSPJD':5,'TSCH':5,'TSSKD':5,'TSLKS':5,'TSYMY':5,'TSDJL':5,'TSGWHS':5,'TSTHYY':5};function _getSlimefunId(s){if(!s||s.getType()===Material.AIR)return null;try{var m=s.getItemMeta();if(m){var p=m.getPersistentDataContainer();if(p.has(SF_ITEM_KEY,PersistentDataType.STRING))return p.get(SF_ITEM_KEY,PersistentDataType.STRING);}}catch(e){}var sf=SlimefunItem.getByItem(s);return sf?sf.getId():null;}function _creditLock(){if(plugin.gltcCreditLock==null)plugin.gltcCreditLock=new java.lang.Object();return plugin.gltcCreditLock;}function _getCreditUnlocked(u){var f=new File(DATA_DIR.getAbsolutePath()+'/'+u+'.json');if(!f.exists())return 0;try{var b=Files.readAllBytes(f.toPath());var bb=Java.type('java.nio.ByteBuffer');var cb=StandardCharsets.UTF_8.decode(bb.wrap(b));return JSON.parse(cb.toString()).credit||0;}catch(e){return 0;}}function _setCreditUnlocked(u,c){var f=new File(DATA_DIR.getAbsolutePath()+'/'+u+'.json');try{var l=new java.util.ArrayList();l.add(JSON.stringify({credit:c},null,2));Files.write(f.toPath(),l,StandardCharsets.UTF_8);return true;}catch(e){try{Java.type('org.bukkit.Bukkit').getLogger().warning('[GLTC信用点] 写入失败 '+u+': '+e);}catch(e2){}return false;}}function _getCredit(u){return Java.synchronized(_creditLock(),function(){return _getCreditUnlocked(u);})();}function _setCredit(u,c){return Java.synchronized(_creditLock(),function(){return _setCreditUnlocked(u,c);})();}function _trySpendCredit(u,cost){return Java.synchronized(_creditLock(),function(){var cur=_getCreditUnlocked(u);if(cur<cost)return false;return _setCreditUnlocked(u,cur-cost);})();}function _findCard(inv,uuid){for(var i=0;i<inv.getSize();i++){var s=inv.getItem(i);if(!s||s.getType()===Material.AIR)continue;var id=_getSlimefunId(s);if(!id||id!==CARD_ID)continue;var m=s.getItemMeta();if(!m)continue;var p=m.getPersistentDataContainer();if(p.has(CARD_OWNER_KEY,PersistentDataType.STRING)&&p.get(CARD_OWNER_KEY,PersistentDataType.STRING)===uuid)return true;}return false;}function _updateCardLore(inv,uuid,name,credit){for(var i=0;i<inv.getSize();i++){var s=inv.getItem(i);if(!s||s.getType()===Material.AIR)continue;var id=_getSlimefunId(s);if(!id||id!==CARD_ID)continue;var m=s.getItemMeta();if(!m)continue;var p=m.getPersistentDataContainer();if(p.has(CARD_OWNER_KEY,PersistentDataType.STRING)&&p.get(CARD_OWNER_KEY,PersistentDataType.STRING)===uuid){var lore=m.getLore();if(lore&&lore.size()>=6){lore.set(4,'§f[§e凭证持有者§f]§b '+name);lore.set(5,'§f[§e信用点余额§f]§b '+credit+'△');m.setLore(lore);s.setItemMeta(m);}}}}function calcCreditCost(pl){var t=0;for(var i=0;i<pl.length;i++){t+=(pl[i].amount*(EXCHANGE_RATES[pl[i].id]||0));}return t;}

const BATCH_MULTIPLIER = 2;
const COOLDOWN_MAP = new java.util.HashMap();
const COOLDOWN_MS = 200;

function isOnCooldown(player) {
    const last = COOLDOWN_MAP.get(player);
    if (!last) return false;
    if (Date.now() - last < COOLDOWN_MS) return true;
    COOLDOWN_MAP.remove(player);
    return false;
}
function setCooldown(player) { COOLDOWN_MAP.put(player, Date.now()); }

function item(mat, name, lore) {
    const it = new ItemStack(Material.getMaterial(mat));
    const meta = it.getItemMeta();
    meta.setDisplayName(name);
    if (lore) meta.setLore(Array.isArray(lore) ? lore : [lore]);
    it.setItemMeta(meta);
    return it;
}
function borderItem() { return item('BLUE_STAINED_GLASS_PANE', '§6 '); }
function applyBorder(inv) { const b = borderItem(); BORDER_SLOTS.forEach(s => inv.setItem(s, b.clone())); }

function hasEnough(player, priceList, multiplier, batchMul) {
    var uuid = player.getUniqueId().toString();
    var cost = calcCreditCost(priceList) * multiplier * (batchMul || 1);
    return _getCredit(uuid) >= cost;
}
function removeItems(player, priceList, multiplier, batchMul) {
    var uuid = player.getUniqueId().toString();
    var cost = calcCreditCost(priceList) * multiplier * (batchMul || 1);
    if (!_trySpendCredit(uuid, cost)) return false;
    _updateCardLore(player.getInventory(), uuid, player.getName(), _getCredit(uuid));
    return true;
}
function canAddItem(player, itemStack, amount) {
    const maxStack = itemStack.getMaxStackSize();
    let remaining = amount;
    const inv = player.getInventory();
    for (let i = 0; i < 36; i++) {
        const stack = inv.getItem(i);
        if (stack == null) { remaining -= maxStack; if (remaining <= 0) return true; continue; }
        if (stack.isSimilar(itemStack)) {
            const space = maxStack - stack.getAmount();
            if (space > 0) { remaining -= space; if (remaining <= 0) return true; }
        }
    }
    return false;
}
function giveItems(player, itemProto, amount) {
    const maxStack = itemProto.getMaxStackSize();
    let give = amount;
    while (give > 0) {
        const copy = itemProto.clone();
        copy.setAmount(Math.min(maxStack, give));
        const left = player.getInventory().addItem(copy);
        if (!left.isEmpty()) player.getWorld().dropItem(player.getLocation(), left.values().iterator().next());
        give -= Math.min(maxStack, give);
    }
}

function getBuyMessage(priceList, times, totalGive, itemId, playerUuid, batchMul) {
    var _unitPrice = calcCreditCost(priceList);
    var creditCost = _unitPrice * times * (batchMul || 1);
    var itemName = ITEM_NAMES[itemId] || itemId;
    var balance = _getCredit(playerUuid);
    var prefix = (
        '§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T' +
        '§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合' +
        '§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f]' +
        '§x§F§F§B§A§6§8协§x§F§0§D§8§7§3议§x§E§2§F§5§7§D流' +
        '§x§A§F§F§A§5对§x§6§B§F§F§D§B接§x§4§1§F§1§F§F成' +
        '§x§4§C§C§5§F§F功§x§5§7§9§A§F§F，'
    );
    if (times > 1) {
        var _mul = batchMul || 1;
        return prefix + '§x§F§F§F§5§B§3本次兑换消耗§c' + _mul + '§x§F§F§F§5§B§3倍信用点，总计消耗§c' + _mul + '*' + times + '*' + _unitPrice + '=' + creditCost + '△ §x§F§F§F§5§B§3信用点，获得§a' + totalGive + ' §x§F§F§F§5§B§3个 §e' + itemName + ' §x§F§F§F§5§B§3。§x§F§F§F§5§B§3当前余额：§b' + balance + '△';
    } else {
        return prefix + '§x§F§F§F§5§B§3消耗 §b' + creditCost + '△ §x§F§F§F§5§B§3信用点兑换了 §a' + totalGive + ' §x§F§F§F§5§B§3个 §e' + itemName + ' §x§F§F§F§5§B§3。§x§F§F§F§5§B§3当前余额：§b' + balance + '△';
    }
}

function getFailMessage(currencyName, neededAmount) {
    var prefix = (
        '§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T' +
        '§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合' +
        '§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f]' +
        '§x§F§F§9§4§9§4协§x§D§C§8§3§C§2议§x§B§9§7§3§F§0流' +
        '§x§B§0§5§D§E§E对§x§B§5§4§6§D§5接§x§B§6§3§7§B§2失' +
        '§x§B§1§3§B§7§B败§x§A§C§3§F§4§5，'
    );
    if (neededAmount < 0) return prefix + '§x§E§7§9§3§9§8背包中没有已绑定的银行卡。';
    return prefix + '§x§E§7§9§3§9§8信用点不足，需要 §b' + neededAmount + '△§x§E§7§9§3§9§8。';
}

function buildPlantMenu(page) {
    page = page || 0;
    const list = ITEMS['植物'];
    if (!list || !list.length) return null;
    const totalPages = Math.ceil(list.length / PAGE_SIZE);
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;

    const inv = Bukkit.createInventory(null, 54, MAIN_TITLE);
    applyBorder(inv);
    inv.setItem(4, item('LIGHT_BLUE_GLAZED_TERRACOTTA', '§b协议面板用法', [
        '§7使用 §b信用点 §7购买（需持有已绑定的银行卡）',
        '§7点击即购买1个，Shift+点击直接购买64个。',
        '§e第 ' + (page + 1) + '/' + totalPages + ' 页，共' + list.length + '种'
    ]));
    if (totalPages > 1) {
        if (page > 0) inv.setItem(PREV_SLOT, item('ARROW', '§e← 上一页', ['§7点击返回上一页']));
        if (page < totalPages - 1) inv.setItem(NEXT_SLOT, item('ARROW', '§e下一页 →', ['§7点击前往下一页']));
    }
    inv.setItem(49, item('BARRIER', '§c关闭', '§7关闭菜单'));

    const startIdx = page * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, list.length);
    for (let i = startIdx; i < endIdx; i++) {
        const e = list[i];
        const slot = ITEM_SLOTS[i - startIdx];
        let displayItem = null;
        if (e.type === 'vanilla') {
            const mat = Material.getMaterial(e.id);
            if (mat) {
                displayItem = new ItemStack(mat, 1);
                const meta = displayItem.getItemMeta();
                var _creditCost = calcCreditCost(e.price);
                meta.setLore([
                    '§x§F§F§F§5§B§3点击即消耗 §b' + _creditCost + '△ §x§F§F§F§5§B§3信用点兑换。',
                    '§x§F§F§C§2§7§Bshift+点击将购买64个，但所需信用点将翻§c' + BATCH_MULTIPLIER + '§x§F§F§C§2§7§B倍！'
                ]);
                displayItem.setItemMeta(meta);
            }
        } else {
            const sf = SlimefunItem.getById(e.id);
            if (sf) {
                displayItem = sf.getItem().clone();
                const meta = displayItem.getItemMeta();
                var _creditCost = calcCreditCost(e.price);
                meta.setLore([
                    '§x§F§F§F§5§B§3点击即消耗 §b' + _creditCost + '△ §x§F§F§F§5§B§3信用点兑换。',
                    '§x§F§F§C§2§7§Bshift+点击将购买64个，但所需信用点将翻§c' + BATCH_MULTIPLIER + '§x§F§F§C§2§7§B倍！'
                ]);
                displayItem.setItemMeta(meta);
            }
        }
        if (displayItem) inv.setItem(slot, displayItem);
        else inv.setItem(slot, item('BARRIER', '§c无效物品', ['§7ID: ' + e.id]));
    }
    return inv;
}

const openPlayers = new java.util.HashSet();
const PAGE_MAP = new java.util.HashMap();
const PAGE_SWITCHING = new java.util.HashSet();
let registered = false;

function ensureListener() {
    if (registered) return;
    const DragEvent = Java.type('org.bukkit.event.inventory.InventoryDragEvent');
    var _oldShopL = plugin[SHOP_LISTENER_KEY];
    if (_oldShopL) {
        ClickEvent.getHandlerList().unregister(_oldShopL);
        CloseEvent.getHandlerList().unregister(_oldShopL);
        DragEvent.getHandlerList().unregister(_oldShopL);
        plugin[SHOP_LISTENER_KEY] = null;
    }
    const L = Java.extend(Listener, {});
    const listener = new L();

    Bukkit.getPluginManager().registerEvent(ClickEvent, listener, EventPriority.NORMAL, (l, e) => {
        try {
            const p = e.getWhoClicked();
            if (!openPlayers.contains(p)) return;
            if (e.getView().getTitle() !== MAIN_TITLE) return;
            const topInv = e.getView().getTopInventory();
            const clickedInv = e.getClickedInventory();
            if (clickedInv !== topInv) {
                if (clickedInv === e.getView().getBottomInventory() && e.isShiftClick()) e.setCancelled(true);
                return;
            }
            e.setCancelled(true);
            const slot = e.getSlot();
            const it = e.getCurrentItem();
            if (!it || it.getType() === Material.AIR) return;

            if (slot === PREV_SLOT && it.getItemMeta().getDisplayName() === '§e← 上一页') {
                const cur = PAGE_MAP.get(p) || 0;
                if (cur > 0) { PAGE_MAP.put(p, cur - 1); const inv = buildPlantMenu(cur - 1); if (inv) openMenu(p, inv); }
                return;
            }
            if (slot === NEXT_SLOT && it.getItemMeta().getDisplayName() === '§e下一页 →') {
                const cur = PAGE_MAP.get(p) || 0;
                const totalPages = Math.ceil(ITEMS['植物'].length / PAGE_SIZE);
                if (cur < totalPages - 1) { PAGE_MAP.put(p, cur + 1); const inv = buildPlantMenu(cur + 1); if (inv) openMenu(p, inv); }
                return;
            }
            if (slot === 49 && it.getItemMeta().getDisplayName() === '§c关闭') { p.closeInventory(); return; }
            if (slot === 4 || BORDER_SLOTS.includes(slot)) return;

            const list = ITEMS['植物'];
            const page = PAGE_MAP.get(p) || 0;
            let itemIndex = -1;
            for (let i = 0; i < ITEM_SLOTS.length; i++) {
                if (ITEM_SLOTS[i] === slot) { itemIndex = page * PAGE_SIZE + i; break; }
            }
            if (itemIndex < 0 || itemIndex >= list.length) return;
            const config = list[itemIndex];
            if (!config || !config.price) { p.sendMessage('§c价格配置错误'); return; }
            if (isOnCooldown(p)) { p.sendMessage('§c操作过快，请稍后再试'); return; }

            let itemProto = null;
            if (config.type === 'vanilla') {
                const mat = Material.getMaterial(config.id);
                if (mat) itemProto = new ItemStack(mat);
            } else {
                const sf = SlimefunItem.getById(config.id);
                if (sf) itemProto = sf.getItem().clone();
            }
            if (!itemProto) { p.sendMessage('§c物品配置错误'); return; }

            const isShift = e.isShiftClick();
            const times = isShift ? 64 : 1;
            const totalGive = times;
            var _batchMul = isShift ? BATCH_MULTIPLIER : 1;
            var _creditCost = calcCreditCost(config.price) * times * _batchMul;

            var _uuid = p.getUniqueId().toString();
            if (!_findCard(p.getInventory(), _uuid)) {
                p.sendMessage(getFailMessage('', -1));
                return;
            }
            if (!hasEnough(p, config.price, times, _batchMul)) {
                p.sendMessage(getFailMessage('', _creditCost));
                return;
            }
            if (!canAddItem(p, itemProto, totalGive)) {
                p.sendMessage('§c背包空间不足');
                return;
            }

            if (!removeItems(p, config.price, times, _batchMul)) {
                p.sendMessage(getFailMessage('', _creditCost));
                return;
            }
            giveItems(p, itemProto, totalGive);
            p.sendMessage(getBuyMessage(config.price, times, totalGive, config.id, _uuid, _batchMul));
            setCooldown(p);
        } catch (err) { print("植物兑换错误: " + err); }
    }, plugin);

    Bukkit.getPluginManager().registerEvent(CloseEvent, listener, EventPriority.NORMAL, (l, e) => {
        const p = e.getPlayer();
        if (PAGE_SWITCHING.contains(p)) return;
        openPlayers.remove(p); COOLDOWN_MAP.remove(p); PAGE_MAP.remove(p);
        if (openPlayers.isEmpty()) {
            ClickEvent.getHandlerList().unregister(listener);
            CloseEvent.getHandlerList().unregister(listener);
            DragEvent.getHandlerList().unregister(listener);
            plugin[SHOP_LISTENER_KEY] = null; registered = false;
        }
    }, plugin);

    Bukkit.getPluginManager().registerEvent(DragEvent, listener, EventPriority.NORMAL, (l, e) => {
        if (!openPlayers.contains(e.getWhoClicked())) return;
        if (e.getView().getTitle() !== MAIN_TITLE) return;
        const topSize = e.getView().getTopInventory().getSize();
        const itSlots = e.getRawSlots().iterator();
        while (itSlots.hasNext()) if (itSlots.next() < topSize) { e.setCancelled(true); return; }
    }, plugin);
    plugin[SHOP_LISTENER_KEY] = listener; registered = true;
}

function openMenu(p, inv) { PAGE_SWITCHING.add(p); p.openInventory(inv); PAGE_SWITCHING.remove(p); openPlayers.add(p); ensureListener(); }
function openMain(p) { PAGE_MAP.put(p, 0); const inv = buildPlantMenu(0); if (inv) openMenu(p, inv); }

function onButtonGroupClick(player, slot, clickedItem, clickAction, guideMode) { try { openMain(player); return true; } catch (err) { player.sendMessage('§c无法打开植物兑换菜单'); return false; } }
function onUse(e) { try { openMain(e.getPlayer()); } catch (err) { e.getPlayer().sendMessage('§c无法打开植物兑换菜单'); } return false; }