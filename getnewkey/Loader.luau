local Players = game:GetService("Players")
local CoreGui = game:GetService("CoreGui")
local HttpService = game:GetService("HttpService")
local GuiService = game:GetService("GuiService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local LocalPlayer = Players.LocalPlayer
local KEY_PAGE = "https://zyphor.cc/getnewkey"
local TOS_PAGE = "https://zyphor.cc/tos.html"
local PP_PAGE = "https://zyphor.cc/pp.html"
local TEAM_PAGE = "https://zyphor.cc/TeamVaprix"
local SERVER_CONFIG = "https://zyphor.cc/server.txt"
local KEY_VALID = false
local KEY_INFO = nil

local requestFunction = nil
if type(syn) == "table" and type(syn.request) == "function" then
    requestFunction = syn.request
elseif type(http_request) == "function" then
    requestFunction = http_request
elseif type(request) == "function" then
    requestFunction = request
elseif type(http) == "table" and type(http.request) == "function" then
    requestFunction = http.request
end

local function getHardwareId()
    local sources = {
        function()
            if type(gethwid) == "function" then
                return gethwid()
            end
            return nil
        end,
        function()
            if type(syn) == "table" and type(syn.gethwid) == "function" then
                return syn.gethwid()
            end
            return nil
        end,
        function()
            if type(getgenv) == "function" then
                local env = getgenv()
                if type(env) == "table" and type(env.gethwid) == "function" then
                    return env.gethwid()
                end
            end
            return nil
        end
    }
    for _, source in ipairs(sources) do
        local ok, value = pcall(source)
        if ok and value ~= nil and tostring(value) ~= "" then
            return tostring(value)
        end
    end
    return nil
end

local function getServerUrl()
    local response = requestFunction({ Url = SERVER_CONFIG, Method = "GET" })
    if type(response) ~= "table" then
        error("Could not retrieve the Zyphor server URL.")
    end
    local statusCode = tonumber(response.StatusCode or response.Status or 0) or 0
    if statusCode < 200 or statusCode >= 300 then
        error("Could not retrieve the Zyphor server URL.")
    end
    local url = tostring(response.Body or ""):gsub("%s+", "")
    url = url:gsub("/+$", "")
    if not url:match("^https?://") then
        error("The Zyphor server URL is invalid.")
    end
    return url
end

local function openUrl(url)
    local opened = false
    if type(syn) == "table" and type(syn.open_url) == "function" then
        opened = pcall(function()
            syn.open_url(url)
        end)
    end
    if not opened and type(open_url) == "function" then
        opened = pcall(function()
            open_url(url)
        end)
    end
    if not opened then
        opened = pcall(function()
            GuiService:OpenBrowserWindow(url)
        end)
    end
    if not opened and type(setclipboard) == "function" then
        opened = pcall(function()
            setclipboard(url)
        end)
    end
    return opened
end

local function openKeyPage()
    return openUrl(KEY_PAGE)
end

local function make(instanceType, properties, parent)
    local item = Instance.new(instanceType)
    for property, value in pairs(properties or {}) do
        item[property] = value
    end
    item.Parent = parent
    return item
end

local parent = CoreGui
if type(gethui) == "function" then
    local ok, value = pcall(gethui)
    if ok and value then
        parent = value
    end
end

pcall(function()
    local old = parent:FindFirstChild("ZyphorKeyClient")
    if old then
        old:Destroy()
    end
end)

local gui = make("ScreenGui", {
    Name = "ZyphorKeyClient",
    ResetOnSpawn = false,
    IgnoreGuiInset = true,
    ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
    DisplayOrder = 999
}, parent)

local scale = make("UIScale", { Scale = 1 }, gui)

local frame = make("Frame", {
    Name = "Main",
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.fromScale(0.5, 0.5),
    Size = UDim2.fromOffset(540, 650),
    BackgroundColor3 = Color3.fromRGB(12, 15, 27),
    BorderSizePixel = 0,
    ClipsDescendants = true
}, gui)
make("UICorner", { CornerRadius = UDim.new(0, 22) }, frame)
make("UIStroke", { Color = Color3.fromRGB(116, 106, 255), Transparency = 0.22, Thickness = 1.3 }, frame)
make("UIGradient", {
    Rotation = 135,
    Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(21, 25, 44)),
        ColorSequenceKeypoint.new(0.55, Color3.fromRGB(13, 17, 30)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(9, 12, 22))
    })
}, frame)

local shadow = make("Frame", {
    Name = "Shadow",
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.fromScale(0.5, 0.5),
    Size = UDim2.fromOffset(552, 662),
    BackgroundColor3 = Color3.fromRGB(70, 58, 180),
    BackgroundTransparency = 0.82,
    BorderSizePixel = 0,
    ZIndex = 0
}, gui)
make("UICorner", { CornerRadius = UDim.new(0, 26) }, shadow)
frame.ZIndex = 1

local accent = make("Frame", {
    Name = "TopAccent",
    Position = UDim2.fromOffset(0, 0),
    Size = UDim2.new(1, 0, 0, 4),
    BorderSizePixel = 0,
    BackgroundColor3 = Color3.fromRGB(133, 111, 255),
    ZIndex = 3
}, frame)
make("UIGradient", {
    Rotation = 0,
    Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(117, 104, 255)),
        ColorSequenceKeypoint.new(0.5, Color3.fromRGB(92, 171, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(173, 102, 255))
    })
}, accent)

local header = make("Frame", {
    Name = "Header",
    Position = UDim2.fromOffset(22, 17),
    Size = UDim2.new(1, -44, 0, 48),
    BackgroundTransparency = 1,
    ZIndex = 2
}, frame)

local logo = make("Frame", {
    Name = "LogoMark",
    Position = UDim2.fromOffset(0, 1),
    Size = UDim2.fromOffset(42, 42),
    BackgroundColor3 = Color3.fromRGB(116, 103, 255),
    BorderSizePixel = 0,
    ZIndex = 3
}, header)
make("UICorner", { CornerRadius = UDim.new(0, 13) }, logo)
make("UIGradient", {
    Rotation = 45,
    Color = ColorSequence.new(Color3.fromRGB(139, 113, 255), Color3.fromRGB(67, 139, 255))
}, logo)
make("TextLabel", {
    Name = "LogoLetter",
    BackgroundTransparency = 1,
    Size = UDim2.fromScale(1, 1),
    Font = Enum.Font.GothamBlack,
    Text = "Z",
    TextColor3 = Color3.new(1, 1, 1),
    TextSize = 25,
    ZIndex = 4
}, logo)

make("TextLabel", {
    Name = "Brand",
    Position = UDim2.fromOffset(53, 1),
    Size = UDim2.fromOffset(174, 23),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamBlack,
    Text = "ZYPHOR",
    TextColor3 = Color3.fromRGB(245, 246, 255),
    TextSize = 18,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 3
}, header)
make("TextLabel", {
    Name = "BrandSubtitle",
    Position = UDim2.fromOffset(54, 24),
    Size = UDim2.fromOffset(180, 15),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamMedium,
    Text = "SECURE SCRIPT ACCESS",
    TextColor3 = Color3.fromRGB(124, 135, 171),
    TextSize = 9,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 3
}, header)

local onlineBadge = make("Frame", {
    Name = "OnlineBadge",
    AnchorPoint = Vector2.new(1, 0.5),
    Position = UDim2.new(1, -82, 0.5, 0),
    Size = UDim2.fromOffset(76, 27),
    BackgroundColor3 = Color3.fromRGB(19, 43, 41),
    BorderSizePixel = 0,
    ZIndex = 3
}, header)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, onlineBadge)
make("UIStroke", { Color = Color3.fromRGB(44, 105, 87), Transparency = 0.3, Thickness = 1 }, onlineBadge)
make("Frame", {
    Name = "OnlineDot",
    Position = UDim2.fromOffset(9, 10),
    Size = UDim2.fromOffset(7, 7),
    BackgroundColor3 = Color3.fromRGB(95, 226, 169),
    BorderSizePixel = 0,
    ZIndex = 4
}, onlineBadge)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, onlineBadge:FindFirstChild("OnlineDot"))
make("TextLabel", {
    Name = "OnlineText",
    Position = UDim2.fromOffset(20, 0),
    Size = UDim2.new(1, -23, 1, 0),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamBold,
    Text = "READY",
    TextColor3 = Color3.fromRGB(142, 239, 198),
    TextSize = 9,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 4
}, onlineBadge)

local minimize = make("TextButton", {
    Name = "Minimize",
    AnchorPoint = Vector2.new(1, 0.5),
    Position = UDim2.new(1, -43, 0.5, 0),
    Size = UDim2.fromOffset(30, 30),
    BackgroundColor3 = Color3.fromRGB(30, 35, 56),
    BorderSizePixel = 0,
    Font = Enum.Font.GothamBold,
    Text = "−",
    TextColor3 = Color3.fromRGB(199, 205, 235),
    TextSize = 20,
    ZIndex = 4,
    AutoButtonColor = false
}, header)
make("UICorner", { CornerRadius = UDim.new(0, 9) }, minimize)

local close = make("TextButton", {
    Name = "Close",
    AnchorPoint = Vector2.new(1, 0.5),
    Position = UDim2.new(1, 0, 0.5, 0),
    Size = UDim2.fromOffset(30, 30),
    BackgroundColor3 = Color3.fromRGB(54, 31, 48),
    BorderSizePixel = 0,
    Font = Enum.Font.GothamBold,
    Text = "×",
    TextColor3 = Color3.fromRGB(255, 170, 190),
    TextSize = 20,
    ZIndex = 4,
    AutoButtonColor = false
}, header)
make("UICorner", { CornerRadius = UDim.new(0, 9) }, close)

local content = make("Frame", {
    Name = "Content",
    Position = UDim2.fromOffset(22, 78),
    Size = UDim2.new(1, -44, 1, -98),
    BackgroundTransparency = 1,
    ZIndex = 2
}, frame)

make("TextLabel", {
    Name = "Eyebrow",
    Position = UDim2.fromOffset(0, 0),
    Size = UDim2.new(1, 0, 0, 19),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamBold,
    Text = "ACCESS PORTAL     /     01",
    TextColor3 = Color3.fromRGB(150, 134, 255),
    TextSize = 10,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 3
}, content)

make("TextLabel", {
    Name = "Heading",
    Position = UDim2.fromOffset(0, 22),
    Size = UDim2.new(1, 0, 0, 38),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamBlack,
    Text = "Unlock your script.",
    TextColor3 = Color3.fromRGB(245, 246, 255),
    TextSize = 25,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 3
}, content)

make("TextLabel", {
    Name = "Description",
    Position = UDim2.fromOffset(1, 61),
    Size = UDim2.new(1, -2, 0, 30),
    BackgroundTransparency = 1,
    Font = Enum.Font.Gotham,
    Text = "Generate a key on Zyphor, then verify it securely.",
    TextColor3 = Color3.fromRGB(151, 161, 192),
    TextSize = 12,
    TextWrapped = true,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 3
}, content)

local stats = make("Frame", {
    Name = "InfoCards",
    Position = UDim2.fromOffset(0, 99),
    Size = UDim2.new(1, 0, 0, 56),
    BackgroundTransparency = 1,
    ZIndex = 3
}, content)

local function createInfoCard(name, x, width, title, subtitle)
    local card = make("Frame", {
        Name = name,
        Position = UDim2.new(x, 0, 0, 0),
        Size = UDim2.new(width, -7, 1, 0),
        BackgroundColor3 = Color3.fromRGB(20, 25, 43),
        BorderSizePixel = 0,
        ZIndex = 3
    }, stats)
    make("UICorner", { CornerRadius = UDim.new(0, 11) }, card)
    make("UIStroke", { Color = Color3.fromRGB(44, 52, 81), Transparency = 0.35, Thickness = 1 }, card)
    make("TextLabel", {
        Name = "Title",
        Position = UDim2.fromOffset(11, 8),
        Size = UDim2.new(1, -17, 0, 17),
        BackgroundTransparency = 1,
        Font = Enum.Font.GothamBold,
        Text = title,
        TextColor3 = Color3.fromRGB(224, 225, 255),
        TextSize = 12,
        TextXAlignment = Enum.TextXAlignment.Left,
        ZIndex = 4
    }, card)
    make("TextLabel", {
        Name = "Subtitle",
        Position = UDim2.fromOffset(11, 27),
        Size = UDim2.new(1, -17, 0, 15),
        BackgroundTransparency = 1,
        Font = Enum.Font.GothamMedium,
        Text = subtitle,
        TextColor3 = Color3.fromRGB(123, 136, 170),
        TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Left,
        ZIndex = 4
    }, card)
    return card
end

createInfoCard("LifetimeCard", 0, 0.34, "7 DAYS", "Default lifetime")
createInfoCard("DeviceCard", 0.34, 0.33, "HWID LOCK", "Device-bound")
createInfoCard("CheckCard", 0.67, 0.33, "24H RESET", "HWID cooldown")

local getKeyButton = make("TextButton", {
    Name = "GetKey",
    Position = UDim2.fromOffset(0, 167),
    Size = UDim2.new(1, 0, 0, 43),
    BackgroundColor3 = Color3.fromRGB(117, 100, 255),
    BorderSizePixel = 0,
    Font = Enum.Font.GothamBold,
    Text = "  ↗     GET YOUR KEY",
    TextColor3 = Color3.new(1, 1, 1),
    TextSize = 13,
    AutoButtonColor = false,
    ZIndex = 3
}, content)
make("UICorner", { CornerRadius = UDim.new(0, 12) }, getKeyButton)
make("UIGradient", {
    Rotation = 0,
    Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(133, 104, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(77, 124, 255))
    })
}, getKeyButton)
make("UIStroke", { Color = Color3.fromRGB(171, 156, 255), Transparency = 0.6, Thickness = 1 }, getKeyButton)

make("TextLabel", {
    Name = "KeyLabel",
    Position = UDim2.fromOffset(1, 220),
    Size = UDim2.new(1, -2, 0, 16),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamBold,
    Text = "YOUR ACCESS KEY",
    TextColor3 = Color3.fromRGB(182, 190, 222),
    TextSize = 10,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 3
}, content)

local keyBox = make("TextBox", {
    Name = "KeyInput",
    Position = UDim2.fromOffset(0, 239),
    Size = UDim2.new(1, 0, 0, 43),
    BackgroundColor3 = Color3.fromRGB(8, 11, 20),
    BorderSizePixel = 0,
    ClearTextOnFocus = false,
    Font = Enum.Font.Code,
    PlaceholderText = "Paste your Zyphor key here…",
    PlaceholderColor3 = Color3.fromRGB(92, 104, 139),
    Text = "",
    TextColor3 = Color3.fromRGB(239, 241, 255),
    TextSize = 12,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 4
}, content)
make("UICorner", { CornerRadius = UDim.new(0, 11) }, keyBox)
local keyStroke = make("UIStroke", { Color = Color3.fromRGB(48, 57, 87), Transparency = 0.15, Thickness = 1 }, keyBox)
make("UIPadding", {
    PaddingLeft = UDim.new(0, 13),
    PaddingRight = UDim.new(0, 13)
}, keyBox)

local validateButton = make("TextButton", {
    Name = "Validate",
    Position = UDim2.fromOffset(0, 292),
    Size = UDim2.new(1, 0, 0, 42),
    BackgroundColor3 = Color3.fromRGB(36, 143, 119),
    BorderSizePixel = 0,
    Font = Enum.Font.GothamBold,
    Text = "VERIFY KEY     →",
    TextColor3 = Color3.new(1, 1, 1),
    TextSize = 12,
    AutoButtonColor = false,
    ZIndex = 3
}, content)
make("UICorner", { CornerRadius = UDim.new(0, 12) }, validateButton)
make("UIGradient", {
    Rotation = 0,
    Color = ColorSequence.new(Color3.fromRGB(45, 177, 143), Color3.fromRGB(34, 129, 161))
}, validateButton)

local statusCard = make("Frame", {
    Name = "StatusCard",
    Position = UDim2.fromOffset(0, 344),
    Size = UDim2.new(1, 0, 0, 44),
    BackgroundColor3 = Color3.fromRGB(18, 23, 39),
    BorderSizePixel = 0,
    ZIndex = 3
}, content)
make("UICorner", { CornerRadius = UDim.new(0, 11) }, statusCard)
local statusStroke = make("UIStroke", { Color = Color3.fromRGB(46, 53, 79), Transparency = 0.25, Thickness = 1 }, statusCard)
local statusDot = make("Frame", {
    Name = "StatusDot",
    Position = UDim2.fromOffset(13, 17),
    Size = UDim2.fromOffset(9, 9),
    BackgroundColor3 = Color3.fromRGB(146, 155, 188),
    BorderSizePixel = 0,
    ZIndex = 4
}, statusCard)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, statusDot)
local status = make("TextLabel", {
    Name = "Status",
    Position = UDim2.fromOffset(30, 0),
    Size = UDim2.new(1, -42, 1, 0),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamMedium,
    Text = "A valid key is required to continue.",
    TextColor3 = Color3.fromRGB(157, 167, 199),
    TextSize = 11,
    TextWrapped = true,
    TextXAlignment = Enum.TextXAlignment.Left,
    ZIndex = 4
}, statusCard)

status:GetPropertyChangedSignal("TextColor3"):Connect(function()
    statusDot.BackgroundColor3 = status.TextColor3
    if status.TextColor3 == Color3.fromRGB(113, 229, 180) then
        statusStroke.Color = Color3.fromRGB(54, 119, 94)
    elseif status.TextColor3 == Color3.fromRGB(255, 131, 154) then
        statusStroke.Color = Color3.fromRGB(125, 55, 73)
    else
        statusStroke.Color = Color3.fromRGB(46, 53, 79)
    end
end)

local footer = make("Frame", {
    Name = "Footer",
    Position = UDim2.fromOffset(0, 398),
    Size = UDim2.new(1, 0, 0, 28),
    BackgroundTransparency = 1,
    ZIndex = 3
}, content)

local function footerButton(name, text, x, width)
    local button = make("TextButton", {
        Name = name,
        Position = UDim2.new(x, 0, 0, 0),
        Size = UDim2.new(width, -5, 1, 0),
        BackgroundColor3 = Color3.fromRGB(25, 30, 49),
        BorderSizePixel = 0,
        Font = Enum.Font.GothamBold,
        Text = text,
        TextColor3 = Color3.fromRGB(170, 178, 213),
        TextSize = 10,
        AutoButtonColor = false,
        ZIndex = 3
    }, footer)
    make("UICorner", { CornerRadius = UDim.new(0, 8) }, button)
    make("UIStroke", { Color = Color3.fromRGB(44, 52, 79), Transparency = 0.4, Thickness = 1 }, button)
    return button
end

local tosButton = footerButton("TermsOfService", "TOS", 0, 0.22)
local ppButton = footerButton("PrivacyPolicy", "PRIVACY", 0.22, 0.25)
local teamButton = footerButton("TeamVaprix", "MADE BY TEAMVAPRIX ↗", 0.47, 0.53)

local _footNote = make("TextLabel", {
    Name = "FooterNote",
    Position = UDim2.fromOffset(1, 524),
    Size = UDim2.new(1, -2, 0, 15),
    BackgroundTransparency = 1,
    Font = Enum.Font.GothamMedium,
    Text = "ZYPHOR.CC     •     KEY ACCESS PROTECTED",
    TextColor3 = Color3.fromRGB(89, 101, 135),
    TextSize = 9,
    TextXAlignment = Enum.TextXAlignment.Center,
    ZIndex = 3
}, content)

local accountGui = make("Frame", {
    Name = "AccountTab",
    Position = UDim2.fromOffset(22, 78),
    Size = UDim2.new(1, -44, 1, -98),
    BackgroundTransparency = 1,
    Visible = false,
    ZIndex = 3
}, frame)

make("TextLabel", { Name = "AccountTitle", Position = UDim2.fromOffset(0, 0), Size = UDim2.new(1, 0, 0, 28), BackgroundTransparency = 1, Font = Enum.Font.GothamBlack, Text = "Your key account", TextColor3 = Color3.fromRGB(245, 246, 255), TextSize = 23, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 4 }, accountGui)
make("TextLabel", { Name = "AccountDescription", Position = UDim2.fromOffset(1, 32), Size = UDim2.new(1, -2, 0, 30), BackgroundTransparency = 1, Font = Enum.Font.Gotham, Text = "Key status, device binding, and latest account use.", TextColor3 = Color3.fromRGB(151, 161, 192), TextSize = 11, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 4 }, accountGui)

local accountTabs = make("Frame", { Name = "Tabs", Position = UDim2.fromOffset(0, 70), Size = UDim2.new(1, 0, 0, 36), BackgroundTransparency = 1, ZIndex = 4 }, accountGui)
local accountTabButton = make("TextButton", { Name = "AccountTabButton", Size = UDim2.new(0.5, -5, 1, 0), BackgroundColor3 = Color3.fromRGB(117, 100, 255), BorderSizePixel = 0, Font = Enum.Font.GothamBold, Text = "KEY DETAILS", TextColor3 = Color3.new(1, 1, 1), TextSize = 10, AutoButtonColor = false, ZIndex = 4 }, accountTabs)
make("UICorner", { CornerRadius = UDim.new(0, 9) }, accountTabButton)
local accessTabButton = make("TextButton", { Name = "AccessTabButton", Position = UDim2.new(0.5, 5, 0, 0), Size = UDim2.new(0.5, -5, 1, 0), BackgroundColor3 = Color3.fromRGB(25, 30, 49), BorderSizePixel = 0, Font = Enum.Font.GothamBold, Text = "ACCESS", TextColor3 = Color3.fromRGB(170, 178, 213), TextSize = 10, AutoButtonColor = false, ZIndex = 4 }, accountTabs)
make("UICorner", { CornerRadius = UDim.new(0, 9) }, accessTabButton)

local accountPanel = make("Frame", { Name = "AccountPanel", Position = UDim2.fromOffset(0, 118), Size = UDim2.new(1, 0, 0, 246), BackgroundColor3 = Color3.fromRGB(18, 23, 39), BorderSizePixel = 0, ZIndex = 4 }, accountGui)
make("UICorner", { CornerRadius = UDim.new(0, 14) }, accountPanel)
make("UIStroke", { Color = Color3.fromRGB(46, 53, 79), Transparency = 0.2, Thickness = 1 }, accountPanel)

local function accountField(name, label, y, height)
    make("TextLabel", { Name = name .. "Label", Position = UDim2.fromOffset(15, y), Size = UDim2.new(1, -30, 0, 15), BackgroundTransparency = 1, Font = Enum.Font.GothamBold, Text = label, TextColor3 = Color3.fromRGB(150, 160, 192), TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 5 }, accountPanel)
    return make("TextLabel", { Name = name, Position = UDim2.fromOffset(15, y + 17), Size = UDim2.new(1, -30, 0, height), BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, Text = "—", TextColor3 = Color3.fromRGB(232, 235, 255), TextSize = 12, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 5 }, accountPanel)
end

local expiryValue = accountField("ExpiryValue", "TIME LEFT", 14, 30)
local accountValue = accountField("AccountValue", "LATEST ACCOUNT USED", 68, 24)
local lastUsedValue = accountField("LastUsedValue", "LATEST USE", 122, 24)
local resetValue = accountField("ResetValue", "HWID RESET AVAILABLE", 176, 24)

local hwidCard = make("Frame", { Name = "HwidCard", Position = UDim2.fromOffset(0, 378), Size = UDim2.new(1, 0, 0, 78), BackgroundColor3 = Color3.fromRGB(15, 37, 34), BorderSizePixel = 0, ZIndex = 4 }, accountGui)
make("UICorner", { CornerRadius = UDim.new(0, 12) }, hwidCard)
make("UIStroke", { Color = Color3.fromRGB(51, 125, 96), Transparency = 0.18, Thickness = 1 }, hwidCard)
make("TextLabel", { Name = "HwidLabel", Position = UDim2.fromOffset(13, 10), Size = UDim2.new(1, -26, 0, 15), BackgroundTransparency = 1, Font = Enum.Font.GothamBold, Text = "BOUND HWID · HOLD TO REVEAL", TextColor3 = Color3.fromRGB(125, 231, 181), TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 5 }, hwidCard)
local hwidValue = make("TextButton", { Name = "HwidValue", Position = UDim2.fromOffset(13, 31), Size = UDim2.new(1, -26, 0, 34), BackgroundTransparency = 1, BorderSizePixel = 0, Font = Enum.Font.Code, Text = "••••••••••••••••", TextColor3 = Color3.fromRGB(222, 248, 236), TextSize = 10, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, AutoButtonColor = false, ZIndex = 5 }, hwidCard)

local accountAccessPanel = make("Frame", { Name = "AccessPanel", Position = UDim2.fromOffset(0, 118), Size = UDim2.new(1, 0, 0, 180), BackgroundColor3 = Color3.fromRGB(18, 23, 39), BorderSizePixel = 0, Visible = false, ZIndex = 4 }, accountGui)
make("UICorner", { CornerRadius = UDim.new(0, 14) }, accountAccessPanel)
make("UIStroke", { Color = Color3.fromRGB(46, 53, 79), Transparency = 0.2, Thickness = 1 }, accountAccessPanel)
make("TextLabel", { Position = UDim2.fromOffset(16, 16), Size = UDim2.new(1, -32, 0, 27), BackgroundTransparency = 1, Font = Enum.Font.GothamBold, Text = "Access verified", TextColor3 = Color3.fromRGB(113, 229, 180), TextSize = 16, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 5 }, accountAccessPanel)
make("TextLabel", { Position = UDim2.fromOffset(16, 49), Size = UDim2.new(1, -32, 0, 53), BackgroundTransparency = 1, Font = Enum.Font.Gotham, Text = "This key is valid for the bound device. Your license countdown updates automatically.", TextColor3 = Color3.fromRGB(151, 161, 192), TextSize = 11, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 5 }, accountAccessPanel)
local accountBackButton = make("TextButton", { Name = "BackToLogin", Position = UDim2.fromOffset(0, 470), Size = UDim2.new(1, 0, 0, 38), BackgroundColor3 = Color3.fromRGB(25, 30, 49), BorderSizePixel = 0, Font = Enum.Font.GothamBold, Text = "BACK TO KEY LOGIN", TextColor3 = Color3.fromRGB(196, 199, 255), TextSize = 10, AutoButtonColor = false, ZIndex = 4 }, accountGui)
make("UICorner", { CornerRadius = UDim.new(0, 10) }, accountBackButton)
local minimized = false
local expandedSize = UDim2.fromOffset(540, 650)
local minimizedSize = UDim2.fromOffset(540, 82)
local function tween(instance, properties, duration)
    local animation = TweenService:Create(instance, TweenInfo.new(duration or 0.18, Enum.EasingStyle.Quint, Enum.EasingDirection.Out), properties)
    animation:Play()
    return animation
end

local function updateScale()
    local camera = workspace.CurrentCamera
    if not camera then
        scale.Scale = 1
        return
    end
    local viewport = camera.ViewportSize
    scale.Scale = math.clamp(math.min((viewport.X - 24) / 552, (viewport.Y - 24) / 662, 1), 0.55, 1)
end

updateScale()
if workspace.CurrentCamera then
    workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(updateScale)
end

local dragging = false
local dragInput = nil
local dragStart = nil
local startPosition = nil
header.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        dragStart = input.Position
        startPosition = frame.Position
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                dragging = false
            end
        end)
    end
end)
header.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
        dragInput = input
    end
end)
UserInputService.InputChanged:Connect(function(input)
    if dragging and input == dragInput and dragStart and startPosition then
        local delta = input.Position - dragStart
        frame.Position = UDim2.new(startPosition.X.Scale, startPosition.X.Offset + delta.X, startPosition.Y.Scale, startPosition.Y.Offset + delta.Y)
        shadow.Position = frame.Position
    end
end)

local function addHover(button, normalColor, hoverColor)
    button.MouseEnter:Connect(function()
        if button.Active then
            tween(button, { BackgroundColor3 = hoverColor }, 0.14)
        end
    end)
    button.MouseLeave:Connect(function()
        tween(button, { BackgroundColor3 = normalColor }, 0.14)
    end)
end

addHover(close, Color3.fromRGB(54, 31, 48), Color3.fromRGB(93, 38, 59))
addHover(minimize, Color3.fromRGB(30, 35, 56), Color3.fromRGB(47, 54, 83))
addHover(tosButton, Color3.fromRGB(25, 30, 49), Color3.fromRGB(42, 47, 77))
addHover(ppButton, Color3.fromRGB(25, 30, 49), Color3.fromRGB(42, 47, 77))
addHover(teamButton, Color3.fromRGB(25, 30, 49), Color3.fromRGB(42, 47, 77))

keyBox.Focused:Connect(function()
    tween(keyStroke, { Color = Color3.fromRGB(133, 119, 255), Transparency = 0, Thickness = 1.5 }, 0.14)
end)
keyBox.FocusLost:Connect(function()
    tween(keyStroke, { Color = Color3.fromRGB(48, 57, 87), Transparency = 0.15, Thickness = 1 }, 0.14)
end)

close.MouseButton1Click:Connect(function()
    tween(frame, { BackgroundTransparency = 1, Size = UDim2.fromOffset(510, 530) }, 0.14)
    tween(shadow, { BackgroundTransparency = 1 }, 0.14)
    task.delay(0.16, function()
        if gui and gui.Parent then
            gui:Destroy()
        end
    end)
end)

minimize.MouseButton1Click:Connect(function()
    minimized = not minimized
    if minimized then
        content.Visible = false
        minimize.Text = "+"
        tween(frame, { Size = minimizedSize }, 0.22)
        tween(shadow, { Size = UDim2.fromOffset(552, 94) }, 0.22)
    else
        frame.Size = minimizedSize
        shadow.Size = UDim2.fromOffset(552, 94)
        content.Visible = true
        minimize.Text = "−"
        tween(frame, { Size = expandedSize }, 0.24)
        tween(shadow, { Size = UDim2.fromOffset(552, 662) }, 0.24)
    end
end)

tosButton.MouseButton1Click:Connect(function()
    local ok = openUrl(TOS_PAGE)
    status.Text = ok and "Opening Terms of Service…" or "TOS URL copied: " .. TOS_PAGE
    status.TextColor3 = Color3.fromRGB(196, 199, 255)
end)

ppButton.MouseButton1Click:Connect(function()
    local ok = openUrl(PP_PAGE)
    status.Text = ok and "Opening Privacy Policy…" or "Privacy URL copied: " .. PP_PAGE
    status.TextColor3 = Color3.fromRGB(196, 199, 255)
end)

teamButton.MouseButton1Click:Connect(function()
    local ok = openUrl(TEAM_PAGE)
    status.Text = ok and "Opening TeamVaprix…" or "TeamVaprix URL copied: " .. TEAM_PAGE
    status.TextColor3 = Color3.fromRGB(196, 199, 255)
end)

getKeyButton.MouseButton1Click:Connect(function()
    local ok = openKeyPage()
    if ok then
        status.Text = "Opening the Zyphor key page…"
        status.TextColor3 = Color3.fromRGB(155, 164, 193)
        tween(getKeyButton, { BackgroundColor3 = Color3.fromRGB(101, 91, 226) }, 0.12)
        task.delay(0.18, function()
            if getKeyButton and getKeyButton.Parent then
                tween(getKeyButton, { BackgroundColor3 = Color3.fromRGB(117, 100, 255) }, 0.18)
            end
        end)
    elseif type(setclipboard) == "function" then
        status.Text = "Key page URL copied to clipboard."
        status.TextColor3 = Color3.fromRGB(255, 207, 121)
    else
        status.Text = "Open https://zyphor.cc/getnewkey in your browser."
        status.TextColor3 = Color3.fromRGB(255, 207, 121)
    end
end)

local function formatDuration(milliseconds)
    if milliseconds == nil then
        return "No expiry"
    end
    local numericMilliseconds = tonumber(milliseconds)
    if numericMilliseconds == nil then
        return "Unknown expiry"
    end
    local seconds = math.max(0, math.floor(numericMilliseconds / 1000))
    local days = math.floor(seconds / 86400)
    seconds = seconds % 86400
    local hours = math.floor(seconds / 3600)
    seconds = seconds % 3600
    local minutes = math.floor(seconds / 60)
    if days > 0 then
        return string.format("%dd %dh", days, hours)
    end
    if hours > 0 then
        return string.format("%dh %dm", hours, minutes)
    end
    return string.format("%dm", minutes)
end

local function parseIsoTimestamp(value)
    if type(value) ~= "string" then
        return nil
    end
    local yearText, monthText, dayText, hourText, minuteText, secondText = string.match(value, "^(%d%d%d%d)%-(%d%d)%-(%d%d)[Tt ](%d%d):(%d%d):(%d%d)")
    if not yearText or not monthText or not dayText or not hourText or not minuteText or not secondText then
        return nil
    end
    local year = tonumber(yearText)
    local month = tonumber(monthText)
    local day = tonumber(dayText)
    local hour = tonumber(hourText)
    local minute = tonumber(minuteText)
    local second = tonumber(secondText)
    if year == nil or month == nil or day == nil or hour == nil or minute == nil or second == nil then
        return nil
    end
    local ok, timestamp = pcall(function()
        return DateTime.fromUniversalTime(year, month, day, hour, minute, second).UnixTimestamp
    end)
    if ok and type(timestamp) == "number" then
        return timestamp
    end
    return nil
end

local function showAccountTab()
    content.Visible = false
    accountGui.Visible = true
    frame.Size = expandedSize
    shadow.Size = UDim2.fromOffset(552, 662)
    minimize.Text = "−"
    minimized = false
end

local function setAccountTab(tab)
    local details = tab == "details"
    accountPanel.Visible = details
    hwidCard.Visible = details
    accountAccessPanel.Visible = not details
    accountTabButton.BackgroundColor3 = details and Color3.fromRGB(117, 100, 255) or Color3.fromRGB(25, 30, 49)
    accountTabButton.TextColor3 = details and Color3.new(1, 1, 1) or Color3.fromRGB(170, 178, 213)
    accessTabButton.BackgroundColor3 = details and Color3.fromRGB(25, 30, 49) or Color3.fromRGB(117, 100, 255)
    accessTabButton.TextColor3 = details and Color3.fromRGB(170, 178, 213) or Color3.new(1, 1, 1)
end

accountTabButton.MouseButton1Click:Connect(function() setAccountTab("details") end)
accessTabButton.MouseButton1Click:Connect(function() setAccountTab("access") end)
accountBackButton.MouseButton1Click:Connect(function() accountGui.Visible = false content.Visible = true end)

local boundHwid = ""
local function maskHwid()
    hwidValue.Text = boundHwid == "" and "Unavailable" or string.rep("•", math.clamp(#boundHwid, 8, 32))
end
local function revealHwid() if boundHwid ~= "" then hwidValue.Text = boundHwid end end
hwidValue.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then revealHwid() end
end)
hwidValue.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then maskHwid() end
end)
UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then maskHwid() end
end)

local function updateAccountDetails()
    if not KEY_INFO then return end
    local remainingMs = KEY_INFO.remainingMs
    local expirySeconds = KEY_INFO.expiresAt and parseIsoTimestamp(KEY_INFO.expiresAt) or nil
    if expirySeconds then
        remainingMs = math.max(0, (expirySeconds - os.time()) * 1000)
    elseif remainingMs ~= nil then
        remainingMs = math.max(0, remainingMs - 1000)
        KEY_INFO.remainingMs = remainingMs
    end
    expiryValue.Text = formatDuration(remainingMs)
    accountValue.Text = tostring(KEY_INFO.lastAccount or (LocalPlayer.Name .. " (" .. tostring(LocalPlayer.UserId) .. ")"))
    lastUsedValue.Text = tostring(KEY_INFO.lastUsedAt or "Just now")
    resetValue.Text = tostring(KEY_INFO.hwidResetAvailableAt or "Not provided by server")
    expiryValue.TextColor3 = remainingMs ~= nil and remainingMs <= 0 and Color3.fromRGB(255, 131, 154) or Color3.fromRGB(113, 229, 180)
end
task.spawn(function() while gui and gui.Parent do updateAccountDetails() task.wait(1) end end)

validateButton.MouseButton1Click:Connect(function()
    if KEY_VALID then
        print("correct key")
        status.Text = "correct key"
        status.TextColor3 = Color3.fromRGB(113, 229, 180)
        return
    end
    local key = keyBox.Text:gsub("^%s+", ""):gsub("%s+$", "")
    if key == "" then
        status.Text = "Enter your key first."
        status.TextColor3 = Color3.fromRGB(255, 131, 154)
        return
    end
    local hwid = getHardwareId()
    if not hwid then
        status.Text = "This executor does not expose a HWID function."
        status.TextColor3 = Color3.fromRGB(255, 131, 154)
        return
    end
    validateButton.Text = "VERIFYING KEY…"
    validateButton.Active = false
    validateButton.AutoButtonColor = false
    status.Text = "Checking with Zyphor…"
    status.TextColor3 = Color3.fromRGB(155, 164, 193)
    task.spawn(function()
        local ok, result = pcall(function()
            local base = getServerUrl()
            local response = requestFunction({
                Url = base .. "/key-system/validate",
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = HttpService:JSONEncode({
                    key = key,
                    hwid = hwid,
                    account = LocalPlayer.Name .. " (" .. tostring(LocalPlayer.UserId) .. ")"
                })
            })
            if type(response) ~= "table" then
                error("The server returned no response.")
            end
            local statusCode = tonumber(response.StatusCode or response.Status or 0) or 0
            local body = tostring(response.Body or "")
            local decoded = HttpService:JSONDecode(body)
            if statusCode < 200 or statusCode >= 300 then
                error(decoded.message or decoded.error or ("HTTP " .. tostring(statusCode)))
            end
            return decoded
        end)
        validateButton.Text = "VERIFY KEY     →"
        validateButton.Active = true
        validateButton.AutoButtonColor = true
        if not ok then
            status.Text = tostring(result)
            status.TextColor3 = Color3.fromRGB(255, 131, 154)
            return
        end
        if result and result.valid == true then
            local inspectOk, inspectResult = pcall(function()
                local base = getServerUrl()
                local response = requestFunction({
                    Url = base .. "/key-system/inspect",
                    Method = "POST",
                    Headers = { ["Content-Type"] = "application/json" },
                    Body = HttpService:JSONEncode({ key = key })
                })
                if type(response) ~= "table" then return nil end
                local statusCode = tonumber(response.StatusCode or response.Status or 0) or 0
                if statusCode < 200 or statusCode >= 300 then return nil end
                return HttpService:JSONDecode(tostring(response.Body or ""))
            end)
            if inspectOk and type(inspectResult) == "table" then
                for _, field in ipairs({ "keyId", "hwid", "createdAt", "expiresAt", "remainingMs", "durationMinutes", "lastUsedAt", "lastAccount", "account", "hwidResetAvailableAt", "hwidResetRemainingMs", "valid", "expired", "disabled" }) do
                    if inspectResult[field] ~= nil then result[field] = inspectResult[field] end
                end
            end
            KEY_VALID = true
            local remainingMs = result.remainingMs
            if remainingMs == nil and result.expiresAt then
                local expirySeconds = parseIsoTimestamp(result.expiresAt)
                if expirySeconds ~= nil then
                    remainingMs = math.max(0, (expirySeconds - os.time()) * 1000)
                end
            end
            KEY_INFO = {
                keyId = result.keyId,
                hwid = result.hwid or hwid,
                expiresAt = result.expiresAt,
                remainingMs = remainingMs,
                durationMinutes = result.durationMinutes,
                lastUsedAt = result.lastUsedAt,
                lastAccount = result.lastAccount or result.account or (LocalPlayer.Name .. " (" .. tostring(LocalPlayer.UserId) .. ")"),
                hwidResetAvailableAt = result.hwidResetAvailableAt
            }
            _G.ZyphorKeyValid = true
            _G.ZyphorKeyInfo = KEY_INFO
            _G.ZyphorKeyHWID = KEY_INFO.hwid
            _G.ZyphorKeyExpiresAt = KEY_INFO.expiresAt
            _G.ZyphorKeyRemainingMs = KEY_INFO.remainingMs
            if type(getgenv) == "function" then
                pcall(function()
                    local env = getgenv()
                    env.ZyphorKeyValid = true
                    env.ZyphorKeyInfo = KEY_INFO
                    env.ZyphorKeyHWID = KEY_INFO.hwid
                    env.ZyphorKeyExpiresAt = KEY_INFO.expiresAt
                    env.ZyphorKeyRemainingMs = KEY_INFO.remainingMs
                end)
            end
            boundHwid = tostring(KEY_INFO.hwid or "")
            maskHwid()
            updateAccountDetails()
            print("correct key")
            status.Text = "correct key"
            status.TextColor3 = Color3.fromRGB(113, 229, 180)
            validateButton.Text = "ACCESS GRANTED     ✓"
            tween(validateButton, { BackgroundColor3 = Color3.fromRGB(40, 157, 119) }, 0.2)
            task.delay(0.65, function()
                if gui and gui.Parent then
                    showAccountTab()
                    setAccountTab("details")
                end
            end)
        else
            status.Text = tostring(result and (result.message or result.error) or "Invalid key.")
            status.TextColor3 = Color3.fromRGB(255, 131, 154)
        end
    end)
end)
