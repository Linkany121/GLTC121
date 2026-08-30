package com.linkany121.gltc.logic.bootstrap;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import com.linkany121.gltc.logic.common.GltcDataPaths;
import com.linkany121.gltc.logic.credit.CreditCardLogic;
import com.linkany121.gltc.logic.credit.CreditChargerLogic;
import com.linkany121.gltc.logic.credit.CreditService;
import com.linkany121.gltc.logic.credit.EnergyShopGui;
import com.linkany121.gltc.logic.food.FoodCombatListener;
import com.linkany121.gltc.logic.food.GenericHungerFoodLogic;
import com.linkany121.gltc.logic.food.GenericPotionFoodLogic;
import com.linkany121.gltc.logic.food.SpecialFoodLogic;
import com.linkany121.gltc.logic.gun.BeaconLauncherLogic;
import com.linkany121.gltc.logic.gun.GunRegistry;
import com.linkany121.gltc.logic.gun.GunStateListener;
import com.linkany121.gltc.logic.gun.IntegrationGunGui;
import com.linkany121.gltc.logic.gun.IntegrationGunLogic;
import com.linkany121.gltc.logic.gun.MachineGunLogic;
import com.linkany121.gltc.logic.gun.OverloadRifleLogic;
import com.linkany121.gltc.logic.gun.PulsePistolLogic;
import com.linkany121.gltc.logic.gun.RifleGunLogic;
import com.linkany121.gltc.logic.gun.ShotgunGunLogic;
import com.linkany121.gltc.logic.machine.CrimsonFarStarLogic;
import com.linkany121.gltc.logic.machine.FourEyesFuxiLogic;
import com.linkany121.gltc.logic.machine.ForgeHammerLogic;
import com.linkany121.gltc.logic.machine.GunAppearanceDeskLogic;
import com.linkany121.gltc.logic.machine.VasaStaffConverterLogic;
import com.linkany121.gltc.logic.mage.BiAnGangTerminalLogic;
import com.linkany121.gltc.logic.mage.MageService;
import com.linkany121.gltc.logic.mage.SpellDeathAnnouncer;
import com.linkany121.gltc.logic.mage.StaffCastLogic;
import com.linkany121.gltc.logic.mage.YuLiTerminalLogic;
import com.linkany121.gltc.logic.prop.AbyssCallLogic;
import com.linkany121.gltc.logic.prop.AtoSoundBrowserLogic;
import com.linkany121.gltc.logic.prop.ChiGuFlowerPotLogic;
import com.linkany121.gltc.logic.prop.DebugRecipeRecorderLogic;
import com.linkany121.gltc.logic.prop.DebugMenuGeneratorLogic;
import com.linkany121.gltc.logic.prop.SteelTargetLogic;
import com.linkany121.gltc.logic.prop.WheelchairManifestLogic;
import com.linkany121.gltc.logic.skey.ShipCurrencyService;
import com.linkany121.gltc.logic.skey.ShipLinkAccessStationLogic;
import com.linkany121.gltc.logic.skey.ShipOrderPublisherLogic;
import com.linkany121.gltc.logic.skey.ShipOrderReceiverLogic;
import com.linkany121.gltc.logic.weapon.AsplWeaponLogic;
import com.linkany121.gltc.logic.weapon.FengxuWeaponLogic;
import com.linkany121.gltc.logic.weapon.FudiWeaponLogic;
import com.linkany121.gltc.logic.weapon.HuanjianhuWeaponLogic;
import com.linkany121.gltc.logic.weapon.JiumeWeaponLogic;
import com.linkany121.gltc.logic.weapon.PojunWeaponLogic;

import java.io.IOException;
import java.nio.file.Files;
import java.util.logging.Level;

/**
 * Registers global listeners and module services after Slimefun items exist.
 */
public final class GltcLogicBootstrap {

    private static boolean initialized;
    private static CreditChargerLogic creditCharger;
    private static FoodCombatListener foodCombat;
    private static IntegrationGunGui gunGui;
    private static GunStateListener gunState;
    private static AsplWeaponLogic aspl;
    private static FudiWeaponLogic fudi;
    private static PojunWeaponLogic pojun;
    private static HuanjianhuWeaponLogic huanjianhu;
    private static AtoSoundBrowserLogic soundBrowser;
    private static DebugRecipeRecorderLogic recipeRecorder;
    private static DebugMenuGeneratorLogic menuGenerator;
    private static ForgeHammerLogic forgeHammer;
    private static GunAppearanceDeskLogic gunAppearanceDesk;
    private static ShipOrderPublisherLogic shipPublisher;
    private static ShipOrderReceiverLogic shipReceiver;
    private static ShipLinkAccessStationLogic shipAccess;
    private static VasaStaffConverterLogic staffConverter;

    private GltcLogicBootstrap() {
    }

    public static void init(GltcPlugin plugin) {
        if (initialized) {
            return;
        }
        initialized = true;
        ensureDataDirs(plugin);

        CreditService.init(plugin);
        GltcLogicRegistry.registerItem(CreditService.CARD_ID, new CreditCardLogic());
        creditCharger = new CreditChargerLogic();
        GltcLogicRegistry.registerMachine(CreditChargerLogic.MACHINE_ID, creditCharger);
        creditCharger.registerListener(plugin);
        EnergyShopGui.register(plugin);

        registerFood(plugin);
        registerGuns(plugin);
        registerWeapons(plugin);
        registerProps(plugin);
        registerMachines(plugin);
        registerMage(plugin);

        plugin.getLogger().info(
            "[GLTC逻辑] Bootstrap 就绪 (items="
                + GltcLogicRegistry.itemsView().size()
                + ", machines="
                + GltcLogicRegistry.machinesView().size()
                + ")"
        );
    }

    private static void registerGuns(GltcPlugin plugin) {
        GltcLogicRegistry.registerItem(GunRegistry.RIFLE, new RifleGunLogic());
        GltcLogicRegistry.registerItem(GunRegistry.SHOTGUN, new ShotgunGunLogic());
        GltcLogicRegistry.registerItem(GunRegistry.MACHINE_GUN, new MachineGunLogic());
        GltcLogicRegistry.registerItem(GunRegistry.PULSE, new PulsePistolLogic());
        GltcLogicRegistry.registerItem(GunRegistry.BEACON, new BeaconLauncherLogic());
        GltcLogicRegistry.registerItem(GunRegistry.OVERLOAD, new OverloadRifleLogic());

        gunGui = new IntegrationGunGui(plugin);
        gunGui.register();
        GltcLogicRegistry.registerItem(GunRegistry.INTEGRATION_GUN_ID, new IntegrationGunLogic(gunGui));

        gunState = new GunStateListener(plugin);
        gunState.register();
    }

    private static void registerWeapons(GltcPlugin plugin) {
        aspl = new AsplWeaponLogic();
        GltcLogicRegistry.registerItem(AsplWeaponLogic.ITEM_ID, aspl);
        aspl.register(plugin);

        fudi = new FudiWeaponLogic();
        GltcLogicRegistry.registerItem(FudiWeaponLogic.ITEM_ID, fudi);
        fudi.register(plugin);

        pojun = new PojunWeaponLogic();
        GltcLogicRegistry.registerItem(PojunWeaponLogic.ITEM_ID, pojun);
        pojun.register(plugin);

        FengxuWeaponLogic.register(plugin);

        huanjianhu = new HuanjianhuWeaponLogic();
        GltcLogicRegistry.registerItem(HuanjianhuWeaponLogic.ITEM_ID, huanjianhu);
        huanjianhu.register(plugin);

        JiumeWeaponLogic.register(plugin);
    }

    private static void registerProps(GltcPlugin plugin) {
        soundBrowser = new AtoSoundBrowserLogic();
        GltcLogicRegistry.registerItem(AtoSoundBrowserLogic.ITEM_ID, soundBrowser);
        soundBrowser.register(plugin);

        recipeRecorder = new DebugRecipeRecorderLogic();
        GltcLogicRegistry.registerItem(DebugRecipeRecorderLogic.ITEM_ID, recipeRecorder);
        recipeRecorder.register(plugin);

        menuGenerator = new DebugMenuGeneratorLogic();
        GltcLogicRegistry.registerItem(DebugMenuGeneratorLogic.ITEM_ID, menuGenerator);
        menuGenerator.register(plugin);

        GltcLogicRegistry.registerItem(AbyssCallLogic.ITEM_ID, new AbyssCallLogic());
        GltcLogicRegistry.registerItem(ChiGuFlowerPotLogic.ITEM_ID, new ChiGuFlowerPotLogic());
        GltcLogicRegistry.registerItem(SteelTargetLogic.ITEM_ID, new SteelTargetLogic());
        GltcLogicRegistry.registerItem(WheelchairManifestLogic.ITEM_ID, new WheelchairManifestLogic());
    }

    private static void registerMachines(GltcPlugin plugin) {
        ShipCurrencyService.init(plugin);

        forgeHammer = new ForgeHammerLogic();
        GltcLogicRegistry.registerMachine(ForgeHammerLogic.MACHINE_ID, forgeHammer);
        forgeHammer.register(plugin);

        GltcLogicRegistry.registerMachine(CrimsonFarStarLogic.MACHINE_ID, new CrimsonFarStarLogic());
        GltcLogicRegistry.registerMachine(FourEyesFuxiLogic.MACHINE_ID, new FourEyesFuxiLogic());

        gunAppearanceDesk = new GunAppearanceDeskLogic();
        gunAppearanceDesk.register(plugin); // also registerMachine

        shipPublisher = new ShipOrderPublisherLogic();
        GltcLogicRegistry.registerMachine(ShipOrderPublisherLogic.MACHINE_ID, shipPublisher);
        shipPublisher.register(plugin);

        shipReceiver = new ShipOrderReceiverLogic();
        GltcLogicRegistry.registerMachine(ShipOrderReceiverLogic.MACHINE_ID, shipReceiver);
        shipReceiver.register(plugin);

        shipAccess = new ShipLinkAccessStationLogic();
        GltcLogicRegistry.registerMachine(ShipLinkAccessStationLogic.MACHINE_ID, shipAccess);
        shipAccess.register(plugin);

        staffConverter = new VasaStaffConverterLogic();
        GltcLogicRegistry.registerMachine(VasaStaffConverterLogic.MACHINE_ID, staffConverter);
        staffConverter.register(plugin);
    }

    private static void registerMage(GltcPlugin plugin) {
        MageService.init(plugin);
        YuLiTerminalLogic.register(plugin);
        BiAnGangTerminalLogic.register(plugin);
        StaffCastLogic.register(plugin);
        SpellDeathAnnouncer.register(plugin);
    }

    private static void registerFood(GltcPlugin plugin) {
        GenericHungerFoodLogic hunger = new GenericHungerFoodLogic();
        for (String id : GenericHungerFoodLogic.DEFS.keySet()) {
            GltcLogicRegistry.registerItem(id, hunger);
        }
        GenericPotionFoodLogic potion = new GenericPotionFoodLogic();
        for (String id : new String[]{
            "UMPV_板蓝根", "UMPV_满穗线香", "UMPV_末嫦娥", "UMPV_琼华古冶散", "UMPV_原神丸",
            "UMPV_半满之月", "UMPV_辟风兽角", "UMPV_悠久的群天之甘露", "UMPV_龙心", "UMPV_果冻"
        }) {
            GltcLogicRegistry.registerItem(id, potion);
        }
        SpecialFoodLogic special = new SpecialFoodLogic();
        for (String id : new String[]{
            "UMPV_浮沉盐海的阖眸", "UMPV_百香爆烤整身虐王排", "UMPV_灼金香烹餮汤锅",
            "UMPV_疯狂星期四", "UMPV_黄金炒饭"
        }) {
            GltcLogicRegistry.registerItem(id, special);
        }
        foodCombat = new FoodCombatListener(plugin);
        foodCombat.register();
    }

    private static void ensureDataDirs(GltcPlugin plugin) {
        try {
            Files.createDirectories(GltcDataPaths.dataRoot(plugin));
            Files.createDirectories(GltcDataPaths.creditDir(plugin));
            Files.createDirectories(GltcDataPaths.creditLimitDir(plugin));
            Files.createDirectories(GltcDataPaths.mageStatsDir(plugin));
            Files.createDirectories(GltcDataPaths.mageEquipDir(plugin));
            Files.createDirectories(GltcDataPaths.skeyDir(plugin));
            Files.createDirectories(GltcDataPaths.skeyCurrencyDir(plugin));
        } catch (IOException ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC逻辑] 创建 data 目录失败", ex);
        }
    }

    public static void shutdown(GltcPlugin plugin) {
        if (!initialized) {
            return;
        }
        if (gunState != null) {
            gunState.unregister();
            gunState = null;
        }
        if (gunGui != null) {
            gunGui.unregister();
            gunGui = null;
        }
        JiumeWeaponLogic.unregister();
        if (huanjianhu != null) {
            huanjianhu.unregister();
            huanjianhu = null;
        }
        FengxuWeaponLogic.unregister();
        if (pojun != null) {
            pojun.unregister();
            pojun = null;
        }
        if (fudi != null) {
            fudi.unregister();
            fudi = null;
        }
        if (aspl != null) {
            aspl.unregister();
            aspl = null;
        }
        if (soundBrowser != null) {
            soundBrowser.unregister();
            soundBrowser = null;
        }
        if (menuGenerator != null) {
            menuGenerator.unregister();
            menuGenerator = null;
        }
        if (recipeRecorder != null) {
            recipeRecorder.unregister();
            recipeRecorder = null;
        }
        if (staffConverter != null) {
            staffConverter.unregister();
            staffConverter = null;
        }
        StaffCastLogic.unregister();
        SpellDeathAnnouncer.unregister();
        BiAnGangTerminalLogic.unregister();
        YuLiTerminalLogic.unregister();
        MageService.shutdown();
        if (shipAccess != null) {
            shipAccess.unregister();
            shipAccess = null;
        }
        if (shipReceiver != null) {
            shipReceiver.unregister();
            shipReceiver = null;
        }
        if (shipPublisher != null) {
            shipPublisher.unregister();
            shipPublisher = null;
        }
        if (gunAppearanceDesk != null) {
            gunAppearanceDesk.unregister();
            gunAppearanceDesk = null;
        }
        if (forgeHammer != null) {
            forgeHammer.unregister();
            forgeHammer = null;
        }
        ShipCurrencyService.shutdown();
        if (foodCombat != null) {
            foodCombat.unregister();
            foodCombat = null;
        }
        if (creditCharger != null) {
            creditCharger.unregisterListener();
            creditCharger = null;
        }
        EnergyShopGui.unregister();
        CreditService.shutdown();
        GltcLogicRegistry.clear();
        initialized = false;
        plugin.getLogger().info("[GLTC逻辑] Bootstrap 已关闭");
    }

    public static boolean isInitialized() {
        return initialized;
    }
}
