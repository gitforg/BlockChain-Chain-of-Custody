// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AccessControlManager
 * @dev Manages role-based access control for the Chain of Custody system
 * Roles: ADMIN, OFFICER, ANALYST, COURT
 */
contract AccessControlManager is AccessControl {
    // Define role constants
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    bytes32 public constant ANALYST_ROLE = keccak256("ANALYST_ROLE");
    bytes32 public constant COURT_ROLE = keccak256("COURT_ROLE");

    // Events
    event RoleAssigned(address indexed user, bytes32 indexed role);
    event RoleRevoked(address indexed user, bytes32 indexed role);

    /**
     * @dev Initialize with deployer as admin
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Admin adds an officer
     * Only ADMIN_ROLE can call this
     */
    function addOfficer(address _officer) external onlyRole(ADMIN_ROLE) {
        require(_officer != address(0), "Invalid address");
        _grantRole(OFFICER_ROLE, _officer);
        emit RoleAssigned(_officer, OFFICER_ROLE);
    }

    /**
     * @dev Admin adds an analyst
     * Only ADMIN_ROLE can call this
     */
    function addAnalyst(address _analyst) external onlyRole(ADMIN_ROLE) {
        require(_analyst != address(0), "Invalid address");
        _grantRole(ANALYST_ROLE, _analyst);
        emit RoleAssigned(_analyst, ANALYST_ROLE);
    }

    /**
     * @dev Admin adds a court user
     * Only ADMIN_ROLE can call this
     */
    function addCourtUser(address _courtUser) external onlyRole(ADMIN_ROLE) {
        require(_courtUser != address(0), "Invalid address");
        _grantRole(COURT_ROLE, _courtUser);
        emit RoleAssigned(_courtUser, COURT_ROLE);
    }

    /**
     * @dev Admin revokes a role
     */
    function revokeRole(
        bytes32 _role,
        address _account
    ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(_role, _account);
        emit RoleRevoked(_account, _role);
    }

    /**
     * @dev Check if user has officer role
     */
    function isOfficer(address _user) external view returns (bool) {
        return hasRole(OFFICER_ROLE, _user);
    }

    /**
     * @dev Check if user has analyst role
     */
    function isAnalyst(address _user) external view returns (bool) {
        return hasRole(ANALYST_ROLE, _user);
    }

    /**
     * @dev Check if user has court role
     */
    function isCourtUser(address _user) external view returns (bool) {
        return hasRole(COURT_ROLE, _user);
    }

    /**
     * @dev Check if user has admin role
     */
    function isAdmin(address _user) external view returns (bool) {
        return hasRole(ADMIN_ROLE, _user);
    }
}
