using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace oncalltool.Migrations
{
    /// <inheritdoc />
    public partial class InitialOnCallDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Role = table.Column<string>(type: "text", nullable: false),
                    SchedulePrivilege = table.Column<bool>(type: "boolean", nullable: false),
                    DepartmentId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OnCallSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateTime>(type: "date", nullable: false),
                    DepartmentId = table.Column<int>(type: "integer", nullable: false),
                    PrimaryEmployeeId = table.Column<int>(type: "integer", nullable: true),
                    SecondaryEmployeeId = table.Column<int>(type: "integer", nullable: true),
                    DayType = table.Column<string>(type: "text", nullable: true),
                    PrimaryStatus = table.Column<string>(type: "text", nullable: true),
                    SwapNote = table.Column<string>(type: "text", nullable: true),
                    IncidentCount = table.Column<int>(type: "integer", nullable: false),
                    ImpactedPlatforms = table.Column<string>(type: "text", nullable: true),
                    IncidentDescription = table.Column<string>(type: "text", nullable: true),
                    ContactNumber = table.Column<string>(type: "text", nullable: true),
                    SourceSheet = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OnCallSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OnCallSchedules_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OnCallSchedules_Users_PrimaryEmployeeId",
                        column: x => x.PrimaryEmployeeId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OnCallSchedules_Users_SecondaryEmployeeId",
                        column: x => x.SecondaryEmployeeId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Name",
                table: "Departments",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OnCallSchedules_DepartmentId_Date",
                table: "OnCallSchedules",
                columns: new[] { "DepartmentId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OnCallSchedules_PrimaryEmployeeId",
                table: "OnCallSchedules",
                column: "PrimaryEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_OnCallSchedules_SecondaryEmployeeId",
                table: "OnCallSchedules",
                column: "SecondaryEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentId_Name",
                table: "Users",
                columns: new[] { "DepartmentId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OnCallSchedules");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Departments");
        }
    }
}
