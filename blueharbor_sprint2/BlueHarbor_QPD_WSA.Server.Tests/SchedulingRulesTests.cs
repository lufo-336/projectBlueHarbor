using BlueHarbor_QPD_WSA.Server.Services;

namespace BlueHarbor_QPD_WSA.Server.Tests
{
    /// <summary>
    /// Test dell'algoritmo di accodamento. Le attese sono derivate dalla SPECIFICA
    /// (primo buco libero lungo almeno Duration, mai prima dell'arrivo ne' nel passato;
    /// intervalli semiaperti [Start, End)), non dall'output dell'implementazione.
    /// </summary>
    public class ComputeOccupationStartDayTests
    {
        private static int Compute(int arrival, int duration, int currentDay,
            params (int Start, int End)[] occupations)
            => SchedulingRules.ComputeOccupationStartDay(arrival, duration, currentDay, occupations);

        // --- banchina libera ---

        [Fact]
        public void NoOccupations_FutureArrival_StartsOnArrivalDay()
        {
            Assert.Equal(10, Compute(arrival: 10, duration: 3, currentDay: 5));
        }

        [Fact]
        public void NoOccupations_ArrivalInThePast_StartsToday()
        {
            Assert.Equal(8, Compute(arrival: 3, duration: 3, currentDay: 8));
        }

        // --- buco prima di un'occupazione futura ---

        [Fact]
        public void GapBeforeFirstOccupation_ExactlyDurationDays_Fits()
        {
            // Libera nei giorni 5-6-7, occupata da 8: una sosta di 3 giorni entra esatta.
            Assert.Equal(5, Compute(arrival: 5, duration: 3, currentDay: 5, (8, 12)));
        }

        [Fact]
        public void GapBeforeFirstOccupation_OneDayShort_QueuesAfterIt()
        {
            // Libera nei giorni 5-6-7 ma la sosta dura 4: non entra, va in coda dal giorno 12.
            Assert.Equal(12, Compute(arrival: 5, duration: 4, currentDay: 5, (8, 12)));
        }

        // --- buco tra due occupazioni ---

        [Fact]
        public void GapBetweenTwoOccupations_Fits()
        {
            Assert.Equal(5, Compute(arrival: 0, duration: 5, currentDay: 0, (0, 5), (10, 20)));
        }

        [Fact]
        public void GapBetweenTwoOccupations_OneDayShort_QueuesAfterSecond()
        {
            Assert.Equal(15, Compute(arrival: 0, duration: 5, currentDay: 0, (0, 5), (9, 15)));
        }

        [Fact]
        public void SmallGapIsSkipped_LargerGapAfterwardsIsUsed()
        {
            // Buco [10,12) di 2 giorni: troppo corto per una sosta di 4. Si accoda dopo il 15.
            Assert.Equal(15, Compute(arrival: 0, duration: 4, currentDay: 2, (2, 6), (6, 10), (12, 15)));
        }

        // --- accodamento ---

        [Fact]
        public void AdjacentOccupations_QueueAfterTheLast()
        {
            Assert.Equal(11, Compute(arrival: 5, duration: 3, currentDay: 5, (5, 8), (8, 11)));
        }

        [Fact]
        public void ShipArrivingDuringAnOccupation_StartsWhenItEnds()
        {
            Assert.Equal(9, Compute(arrival: 6, duration: 3, currentDay: 6, (4, 9)));
        }

        // --- semantica degli intervalli e casi limite ---

        [Fact]
        public void SemiOpenInterval_BerthIsFreeOnTheEndDay()
        {
            // [5,8) significa: giorni 5-6-7 occupati, giorno 8 libero.
            Assert.Equal(8, Compute(arrival: 8, duration: 3, currentDay: 5, (5, 8)));
        }

        [Fact]
        public void OccupationEntirelyInThePast_DoesNotAffectTheResult()
        {
            Assert.Equal(10, Compute(arrival: 5, duration: 3, currentDay: 10, (0, 3)));
        }

        [Fact]
        public void UnorderedOccupations_GiveTheSameResult()
        {
            // Stesso scenario di GapBetweenTwoOccupations_Fits, con la lista invertita.
            Assert.Equal(5, Compute(arrival: 0, duration: 5, currentDay: 0, (10, 20), (0, 5)));
        }

        [Fact]
        public void IntervalsAreAnonymous_TheFunctionDoesNotCareWhatTheyRepresent()
        {
            // La funzione riceve intervalli senza sapere se sono navi o altro (es. manutenzioni):
            // un intervallo "non-nave" blocca esattamente come una nave.
            Assert.Equal(14, Compute(arrival: 6, duration: 3, currentDay: 6, (4, 9), (9, 14)));
        }
    }

    public class IsCompatibleTests
    {
        [Theory]
        [InlineData("S", "S")]
        [InlineData("M", "M")]
        [InlineData("XL", "XL")]
        public void SameSize_IsCompatible(string ship, string berth)
        {
            Assert.True(SchedulingRules.IsCompatible(ship, berth));
        }

        [Fact]
        public void ComparisonIsCaseInsensitive()
        {
            Assert.True(SchedulingRules.IsCompatible("s", "S"));
        }

        [Theory]
        [InlineData("S", "M")]
        [InlineData("XL", "L")]
        [InlineData("L", "XL")] // non deve valere il "contiene": L e XL sono taglie diverse
        public void DifferentSize_IsNotCompatible(string ship, string berth)
        {
            Assert.False(SchedulingRules.IsCompatible(ship, berth));
        }
    }
}
