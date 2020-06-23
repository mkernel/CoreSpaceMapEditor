namespace MapEngine.Sets {

    export enum Part {
        WideEntrance = 'wide_entrance_wall_2',
        Wall = 'wall_12',
        WideHatchway = 'wide_hatchway_wall_5',
        Hatchway = 'hatchway_wall_3',
        Window = 'window_wall_3',
        Entrance = 'entrance_wall_2',
        Cell = 'cell_wall',
        HalfWall = 'half_wall_3',
        HalfWallHatchway = 'half_wall_hatchway_2',
        QuarantinePartition = 'quarantine_partition',
        AutoDoc = 'auto_doc',
        Chair = 'chair_2',
        CO2Scrubber = 'co2_scrubber',
        Conduit = 'conduit',
        GroundConduit = 'groundconduit',
        LargeCrateBrightRed = 'large_crate_bright_red',
        LargeCrateBrightYellow = 'large_crate_bright_yellow',
        LargeCrateGreen = 'large_crate_green_2',
        LargeCrateYellow = 'large_crate_yellow_2',
        ParticleTransmitter = 'particle_transmitter',
        Reactor = 'reactor',
        Shuttle = 'shuttle',
        SmallCrateBrightRed = 'small_crate_bright_red',
        SmallCrateBrightYellow = 'small_crate_bright_yellow',
        SmallCrateGreen = 'small_crate_green_2',
        SmallCrateRed = 'small_crate_red_2',
        Table = 'table_2',
        Workstation = 'workstation_2',
        AdvertisingBoard = 'advertising_board_2',
        BunkGreen = 'bunk_green',
        Bunk = 'bunk_2',
        Girder = 'girder_4',
        Ladder = 'ladder',
        Locker = 'locker_2',
        Screen = 'screen',
        ShopCounter = 'shop_counter_2',
        ShopDisplayStand = 'shop_display_stand_2',
        StorageLocker = 'storage_locker',
        WallConsole = 'wall_console_2',
        ZedsBar = 'zeds_bar'
    }

    export class SetDB {
        coreSet:any = {};

        constructor() {
            this.coreSet[Part.WideEntrance] = 2;
            this.coreSet[Part.Wall] = 12;
            this.coreSet[Part.WideHatchway] = 5;
            this.coreSet[Part.Hatchway] = 3;
            this.coreSet[Part.Window] = 3;
            this.coreSet[Part.Entrance] = 2;
            this.coreSet[Part.HalfWall] = 3;
            this.coreSet[Part.HalfWallHatchway] = 2;
            this.coreSet[Part.Chair] = 2;
            this.coreSet[Part.LargeCrateGreen] = 2;
            this.coreSet[Part.LargeCrateYellow] = 2;
            this.coreSet[Part.SmallCrateGreen] = 2;
            this.coreSet[Part.SmallCrateGreen] = 2;
            this.coreSet[Part.Table] = 2;
            this.coreSet[Part.Workstation] = 2;
            this.coreSet[Part.AdvertisingBoard] = 2;
            this.coreSet[Part.Bunk] = 2;
            this.coreSet[Part.Girder] = 4;
            this.coreSet[Part.Locker] = 2;
            this.coreSet[Part.ShopCounter] = 2;
            this.coreSet[Part.ShopDisplayStand] = 2;
            this.coreSet[Part.WallConsole] = 2;

        }

        sets() {
            return {
                "core":this.coreSet
            };
        }
    }
}