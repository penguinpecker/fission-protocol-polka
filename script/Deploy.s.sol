// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/core/FissionCore.sol";
import "../contracts/amm/FissionAMM.sol";
import "../contracts/router/FissionRouter.sol";
import "../contracts/mocks/MockAssets.sol";

/// @title DeployFission - Full protocol deployment
contract DeployFission {

    struct Deployment {
        address core;
        address router;
        address mockVDOT;
        address mockAUSDT;
        address ammVDOT;
        address ammAUSDT;
        bytes32 marketIdVDOT;
        bytes32 marketIdAUSDT;
    }

    function run() external returns (Deployment memory d) {
        address deployer = msg.sender;

        // Step 1: Deploy Mock Assets
        MockVDOT vdot = new MockVDOT();
        MockAUSDT ausdt = new MockAUSDT();
        d.mockVDOT = address(vdot);
        d.mockAUSDT = address(ausdt);

        // Step 2: Deploy FissionCore
        FissionCore core = new FissionCore(deployer);
        d.core = address(core);

        // Step 3: Create Markets (30 day maturity)
        uint256 vdotMaturity = block.timestamp + 30 days;
        d.marketIdVDOT = core.createMarket(address(vdot), vdotMaturity, "vDOT");

        uint256 ausdtMaturity = block.timestamp + 30 days;
        d.marketIdAUSDT = core.createMarket(address(ausdt), ausdtMaturity, "aUSDT");

        // Step 4: Deploy AMMs
        IFissionCore.Market memory vdotMarket = core.getMarket(d.marketIdVDOT);
        IFissionCore.Market memory ausdtMarket = core.getMarket(d.marketIdAUSDT);

        FissionAMM ammVDOT = new FissionAMM(
            address(core), d.marketIdVDOT, vdotMarket.principalToken, address(vdot), vdotMaturity
        );
        d.ammVDOT = address(ammVDOT);

        FissionAMM ammAUSDT = new FissionAMM(
            address(core), d.marketIdAUSDT, ausdtMarket.principalToken, address(ausdt), ausdtMaturity
        );
        d.ammAUSDT = address(ammAUSDT);

        // Step 5: Deploy Router
        FissionRouter router = new FissionRouter(address(core), address(0));
        router.setMarketAMM(d.marketIdVDOT, address(ammVDOT));
        router.setMarketAMM(d.marketIdAUSDT, address(ammAUSDT));
        d.router = address(router);
    }
}
