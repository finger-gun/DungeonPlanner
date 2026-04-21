import type { ContentPackAsset } from '../../types'
import { dungeonBannersAssets } from './banners'
import { dungeonBarsAssets } from './bars'
import { dungeonPillarsAssets } from './pillars'
import { dungeonBarrelLargeAsset } from "./barrel_large"
import { dungeonBarrelLargeDecoratedAsset } from "./barrel_large_decorated"
import { dungeonBarrelSmallAsset } from "./barrel_small"
import { dungeonBarrelSmallStackAsset } from "./barrel_small_stack"
import { dungeonBedADoubleAsset } from "./bed_A_double"
import { dungeonBedASingleAsset } from "./bed_A_single"
import { dungeonBedAStackedAsset } from "./bed_A_stacked"
import { dungeonBedBDoubleAsset } from "./bed_B_double"
import { dungeonBedBSingleAsset } from "./bed_B_single"
import { dungeonBedDecoratedAsset } from "./bed_decorated"
import { dungeonBedFloorAsset } from "./bed_floor"
import { dungeonBedFrameAsset } from "./bed_frame"
import { dungeonBookBrownAsset } from "./book_brown"
import { dungeonBookGreyAsset } from "./book_grey"
import { dungeonBookTanAsset } from "./book_tan"
import { dungeonBookcaseDoubleAsset } from "./bookcase_double"
import { dungeonBookcaseDoubleDecoratedaAsset } from "./bookcase_double_decoratedA"
import { dungeonBookcaseDoubleDecoratedbAsset } from "./bookcase_double_decoratedB"
import { dungeonBookcaseSingleAsset } from "./bookcase_single"
import { dungeonBookcaseSingleDecoratedaAsset } from "./bookcase_single_decoratedA"
import { dungeonBookcaseSingleDecoratedbAsset } from "./bookcase_single_decoratedB"
import { dungeonBottleABrownAsset } from "./bottle_A_brown"
import { dungeonBottleAGreenAsset } from "./bottle_A_green"
import { dungeonBottleALabeledBrownAsset } from "./bottle_A_labeled_brown"
import { dungeonBottleALabeledGreenAsset } from "./bottle_A_labeled_green"
import { dungeonBottleBBrownAsset } from "./bottle_B_brown"
import { dungeonBottleBGreenAsset } from "./bottle_B_green"
import { dungeonBottleCBrownAsset } from "./bottle_C_brown"
import { dungeonBottleCGreenAsset } from "./bottle_C_green"
import { dungeonBoxLargeAsset } from "./box_large"
import { dungeonBoxSmallAsset } from "./box_small"
import { dungeonBoxSmallDecoratedAsset } from "./box_small_decorated"
import { dungeonBoxStackedAsset } from "./box_stacked"
import { dungeonBucketAsset } from "./bucket"
import { dungeonBucketPickaxesAsset } from "./bucket_pickaxes"
import { dungeonCandleAsset } from "./candle"
import { dungeonCandleLitAsset } from "./candle_lit"
import { dungeonCandleMeltedAsset } from "./candle_melted"
import { dungeonCandleThinAsset } from "./candle_thin"
import { dungeonCandleThinLitAsset } from "./candle_thin_lit"
import { dungeonCandleTripleAsset } from "./candle_triple"
import { dungeonChairAsset } from "./chair"
import { dungeonChestAsset } from "./chest"
import { dungeonChestGoldAsset } from "./chest_gold"
import { dungeonChestLargeAsset } from "./chest_large"
import { dungeonChestLargeGoldAsset } from "./chest_large_gold"
import { dungeonChestMimicAsset } from "./chest_mimic"
import { dungeonCoinAsset } from "./coin"
import { dungeonCoinStackLargeAsset } from "./coin_stack_large"
import { dungeonCoinStackMediumAsset } from "./coin_stack_medium"
import { dungeonCoinStackSmallAsset } from "./coin_stack_small"
import { dungeonCrateLargeAsset } from "./crate_large"
import { dungeonCrateLargeDecoratedAsset } from "./crate_large_decorated"
import { dungeonCrateSmallAsset } from "./crate_small"
import { dungeonCratesStackedAsset } from "./crates_stacked"
import { dungeonKegAsset } from "./keg"
import { dungeonKegDecoratedAsset } from "./keg_decorated"
import { dungeonKeyAsset } from "./key"
import { dungeonKeyGoldAsset } from "./key_gold"
import { dungeonKeyringAsset } from "./keyring"
import { dungeonKeyringHangingAsset } from "./keyring_hanging"
import { dungeonPickaxeAsset } from "./pickaxe"
import { dungeonPickaxeGoldAsset } from "./pickaxe_gold"
import { dungeonPlateAsset } from "./plate"
import { dungeonPlateFoodAAsset } from "./plate_food_A"
import { dungeonPlateFoodBAsset } from "./plate_food_B"
import { dungeonPlateSmallAsset } from "./plate_small"
import { dungeonPlateStackAsset } from "./plate_stack"
import { dungeonRocksAsset } from "./rocks"
import { dungeonRocksDecoratedAsset } from "./rocks_decorated"
import { dungeonRocksGoldAsset } from "./rocks_gold"
import { dungeonRocksSmallAsset } from "./rocks_small"
import { dungeonRubbleHalfAsset } from "./rubble_half"
import { dungeonRubbleLargeAsset } from "./rubble_large"
import { dungeonShelfLargeAsset } from "./shelf_large"
import { dungeonShelfSmallAsset } from "./shelf_small"
import { dungeonShelfSmallBooksAsset } from "./shelf_small_books"
import { dungeonShelfSmallCandlesAsset } from "./shelf_small_candles"
import { dungeonShelvesAsset } from "./shelves"
import { dungeonShelvesDecoratedAsset } from "./shelves_decorated"
import { dungeonStoolAsset } from "./stool"
import { dungeonSwordShieldAsset } from "./sword_shield"
import { dungeonSwordShieldBrokenAsset } from "./sword_shield_broken"
import { dungeonSwordShieldGoldAsset } from "./sword_shield_gold"
import { dungeonTableLongAsset } from "./table_long"
import { dungeonTableLongBrokenAsset } from "./table_long_broken"
import { dungeonTableLongDecoratedAAsset } from "./table_long_decorated_A"
import { dungeonTableLongDecoratedBAsset } from "./table_long_decorated_B"
import { dungeonTableLongDecoratedCAsset } from "./table_long_decorated_C"
import { dungeonTableLongTableclothAsset } from "./table_long_tablecloth"
import { dungeonTableLongTableclothDecoratedAAsset } from "./table_long_tablecloth_decorated_A"
import { dungeonTableMediumAsset } from "./table_medium"
import { dungeonTableMediumBrokenAsset } from "./table_medium_broken"
import { dungeonTableMediumDecoratedAAsset } from "./table_medium_decorated_A"
import { dungeonTableMediumDecoratedBAsset } from "./table_medium_decorated_B"
import { dungeonTableMediumTableclothAsset } from "./table_medium_tablecloth"
import { dungeonTableMediumTableclothDecoratedBAsset } from "./table_medium_tablecloth_decorated_B"
import { dungeonTableSmallAsset } from "./table_small"
import { dungeonTableSmallDecoratedAAsset } from "./table_small_decorated_A"
import { dungeonTableSmallDecoratedBAsset } from "./table_small_decorated_B"
import { dungeonTableSmallDecoratedCAsset } from "./table_small_decorated_C"
import { dungeonTorchAsset } from "./torch"
import { dungeonTorchLitAsset } from "./torch_lit"
import { dungeonTorchMountedAsset } from "./torch_mounted"
import { dungeonTrunkLargeAAsset } from "./trunk_large_A"
import { dungeonTrunkLargeBAsset } from "./trunk_large_B"
import { dungeonTrunkLargeCAsset } from "./trunk_large_C"
import { dungeonTrunkMediumAAsset } from "./trunk_medium_A"
import { dungeonTrunkMediumBAsset } from "./trunk_medium_B"
import { dungeonTrunkMediumCAsset } from "./trunk_medium_C"
import { dungeonTrunkSmallAAsset } from "./trunk_small_A"
import { dungeonTrunkSmallBAsset } from "./trunk_small_B"
import { dungeonTrunkSmallCAsset } from "./trunk_small_C"

export const dungeonPropAssets: ContentPackAsset[] = [
  ...dungeonBannersAssets,
  ...dungeonBarsAssets,
  ...dungeonPillarsAssets,
  dungeonBarrelLargeAsset,
  dungeonBarrelLargeDecoratedAsset,
  dungeonBarrelSmallAsset,
  dungeonBarrelSmallStackAsset,
  dungeonBedADoubleAsset,
  dungeonBedASingleAsset,
  dungeonBedAStackedAsset,
  dungeonBedBDoubleAsset,
  dungeonBedBSingleAsset,
  dungeonBedDecoratedAsset,
  dungeonBedFloorAsset,
  dungeonBedFrameAsset,
  dungeonBookBrownAsset,
  dungeonBookGreyAsset,
  dungeonBookTanAsset,
  dungeonBookcaseDoubleAsset,
  dungeonBookcaseDoubleDecoratedaAsset,
  dungeonBookcaseDoubleDecoratedbAsset,
  dungeonBookcaseSingleAsset,
  dungeonBookcaseSingleDecoratedaAsset,
  dungeonBookcaseSingleDecoratedbAsset,
  dungeonBottleABrownAsset,
  dungeonBottleAGreenAsset,
  dungeonBottleALabeledBrownAsset,
  dungeonBottleALabeledGreenAsset,
  dungeonBottleBBrownAsset,
  dungeonBottleBGreenAsset,
  dungeonBottleCBrownAsset,
  dungeonBottleCGreenAsset,
  dungeonBoxLargeAsset,
  dungeonBoxSmallAsset,
  dungeonBoxSmallDecoratedAsset,
  dungeonBoxStackedAsset,
  dungeonBucketAsset,
  dungeonBucketPickaxesAsset,
  dungeonCandleAsset,
  dungeonCandleLitAsset,
  dungeonCandleMeltedAsset,
  dungeonCandleThinAsset,
  dungeonCandleThinLitAsset,
  dungeonCandleTripleAsset,
  dungeonChairAsset,
  dungeonChestAsset,
  dungeonChestGoldAsset,
  dungeonChestLargeAsset,
  dungeonChestLargeGoldAsset,
  dungeonChestMimicAsset,
  dungeonCoinAsset,
  dungeonCoinStackLargeAsset,
  dungeonCoinStackMediumAsset,
  dungeonCoinStackSmallAsset,
  dungeonCrateLargeAsset,
  dungeonCrateLargeDecoratedAsset,
  dungeonCrateSmallAsset,
  dungeonCratesStackedAsset,
  dungeonKegAsset,
  dungeonKegDecoratedAsset,
  dungeonKeyAsset,
  dungeonKeyGoldAsset,
  dungeonKeyringAsset,
  dungeonKeyringHangingAsset,
  dungeonPickaxeAsset,
  dungeonPickaxeGoldAsset,
  dungeonPlateAsset,
  dungeonPlateFoodAAsset,
  dungeonPlateFoodBAsset,
  dungeonPlateSmallAsset,
  dungeonPlateStackAsset,
  dungeonRocksAsset,
  dungeonRocksDecoratedAsset,
  dungeonRocksGoldAsset,
  dungeonRocksSmallAsset,
  dungeonRubbleHalfAsset,
  dungeonRubbleLargeAsset,
  dungeonShelfLargeAsset,
  dungeonShelfSmallAsset,
  dungeonShelfSmallBooksAsset,
  dungeonShelfSmallCandlesAsset,
  dungeonShelvesAsset,
  dungeonShelvesDecoratedAsset,
  dungeonStoolAsset,
  dungeonSwordShieldAsset,
  dungeonSwordShieldBrokenAsset,
  dungeonSwordShieldGoldAsset,
  dungeonTableLongAsset,
  dungeonTableLongBrokenAsset,
  dungeonTableLongDecoratedAAsset,
  dungeonTableLongDecoratedBAsset,
  dungeonTableLongDecoratedCAsset,
  dungeonTableLongTableclothAsset,
  dungeonTableLongTableclothDecoratedAAsset,
  dungeonTableMediumAsset,
  dungeonTableMediumBrokenAsset,
  dungeonTableMediumDecoratedAAsset,
  dungeonTableMediumDecoratedBAsset,
  dungeonTableMediumTableclothAsset,
  dungeonTableMediumTableclothDecoratedBAsset,
  dungeonTableSmallAsset,
  dungeonTableSmallDecoratedAAsset,
  dungeonTableSmallDecoratedBAsset,
  dungeonTableSmallDecoratedCAsset,
  dungeonTorchAsset,
  dungeonTorchLitAsset,
  dungeonTorchMountedAsset,
  dungeonTrunkLargeAAsset,
  dungeonTrunkLargeBAsset,
  dungeonTrunkLargeCAsset,
  dungeonTrunkMediumAAsset,
  dungeonTrunkMediumBAsset,
  dungeonTrunkMediumCAsset,
  dungeonTrunkSmallAAsset,
  dungeonTrunkSmallBAsset,
  dungeonTrunkSmallCAsset,
]
